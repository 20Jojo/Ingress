using System.Text;
using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Workflow.Api.Auth;
using Workflow.Api.Endpoints;
using Workflow.Api.Middleware;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Projects;
using Workflow.Application.Tasks;
using Workflow.Application.Users;
using Workflow.Domain.Organizations;
using Workflow.Infrastructure.Persistence;
using Workflow.Infrastructure.Repositories;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// ---- Core services
builder.Services.AddHttpContextAccessor();

// ---- ProblemDetails
builder.Services.AddProblemDetails();

// ---- JSON options
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// ---- FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ---- Middleware
builder.Services.AddTransient<ExceptionHandlingMiddleware>();

// ---- DbContext
builder.Services.AddDbContext<WorkflowDbContext>(opt =>
{
    var cs = builder.Configuration.GetConnectionString("WorkflowDb");
    opt.UseNpgsql(cs);
});

// ---- Unit of Work
builder.Services.AddScoped<IUnitOfWork, EfUnitOfWork>();

// ---- Repositories
builder.Services.AddScoped<IOrganizationRepository, EfOrganizationRepository>();
builder.Services.AddScoped<IProjectRepository, EfProjectRepository>();
builder.Services.AddScoped<ITaskRepository, EfTaskRepository>();
builder.Services.AddScoped<IUserRepository, EfUserRepository>();
builder.Services.AddScoped<IOrgMemberRepository, EfOrgMemberRepository>();
builder.Services.AddScoped<IOrgMemberAuditRepository, EfOrgMemberAuditRepository>();
builder.Services.AddScoped<IOrgInvitationRepository, EfOrgInvitationRepository>();
builder.Services.AddScoped<RefreshTokenService>();
builder.Services.AddScoped<IRefreshTokenRepository, EfRefreshTokenRepository>();
builder.Services.AddScoped<PasswordHasher>();

// ---- JWT settings + token service
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<JwtTokenService>();

// ---- Auth: JWT Bearer (REPLACES X-User-Id COMPLETELY)
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["SigningKey"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Missing Jwt:SigningKey in configuration.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = true; // keep ClaimTypes.NameIdentifier available
        options.RequireHttpsMetadata = false; // local dev
        options.SaveToken = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSection["Issuer"],

            ValidateAudience = true,
            ValidAudience = jwtSection["Audience"],

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

// ---- Authorization policies (single source of truth)
builder.Services.AddAuthorization(options =>
{
    // Generic "authenticated user"
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    options.AddPolicy("OrgMember", p =>
        p.RequireAuthenticatedUser()
         .AddRequirements(new OrgRoleRequirement(OrgRole.Member)));

    options.AddPolicy("OrgAdmin", p =>
        p.RequireAuthenticatedUser()
         .AddRequirements(new OrgRoleRequirement(OrgRole.Admin)));

    options.AddPolicy("OrgOwner", p =>
        p.RequireAuthenticatedUser()
         .AddRequirements(new OrgRoleRequirement(OrgRole.Owner)));
});

// ---- Rate limiting (global + auth policy)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // GLOBAL limiter: per user if authenticated, else per IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(http =>
    {
        var userId = http.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var key = !string.IsNullOrWhiteSpace(userId)
            ? $"user:{userId}"
            : $"ip:{http.Connection.RemoteIpAddress}";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: key,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst
            });
    });

    // Strict limiter for /auth: per IP
    options.AddPolicy("Auth", http =>
    {
        var ip = http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"auth:{ip}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });

    // Nice JSON response on 429
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            message = "Too many requests. Please slow down."
        }, cancellationToken: token);
    };
});

// Register ONE handler (the real one)
builder.Services.AddScoped<IAuthorizationHandler, OrgRoleAuthorizationHandler>();

// Swagger (optional; keep it simple)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
 {
     c.SwaggerDoc("v1", new OpenApiInfo
     {
         Title = "Workflow API",
         Version = "v1"
     });

     // Tell Swagger about Bearer auth
     c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
     {
         Name = "Authorization",
         Type = SecuritySchemeType.Http,
         Scheme = "bearer",
         BearerFormat = "JWT",
         In = ParameterLocation.Header,
         Description = "Paste ONLY the token (no 'Bearer ' prefix)."
     });

     // Apply Bearer globally (so you don’t have to set it per endpoint)
     c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document, null),
            new List<string>()
        }
    });
 });


// Redis (IDistributedCache)
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "workflow:";
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.InjectJavascript("/swagger-ui/userid.js");
});

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Endpoints
app.MapAuthEndpoints();          // NEW
app.MapOrganizationEndpoints();
app.MapProjectEndpoints();
app.MapTaskEndpoints();
app.MapUserEndpoints();
app.MapOrgMemberEndpoints();
app.MapOrgInvitationEndpoints();

app.Run();




public partial class Program { }

