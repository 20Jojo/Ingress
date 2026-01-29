using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
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

var builder = WebApplication.CreateBuilder(args);

// ---- Core services
builder.Services.AddHttpContextAccessor();

// ---- Auth: our custom header-based authentication
builder.Services
    .AddAuthentication(CallerAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, CallerAuthenticationHandler>(
        CallerAuthenticationHandler.SchemeName,
        _ => { });

// ---- Authorization policies (single source of truth)
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("OrgMember", p =>
        p.AddAuthenticationSchemes(CallerAuthenticationHandler.SchemeName)
         .RequireAuthenticatedUser()
         .AddRequirements(new OrgRoleRequirement(OrgRole.Member)));

    options.AddPolicy("OrgAdmin", p =>
        p.AddAuthenticationSchemes(CallerAuthenticationHandler.SchemeName)
         .RequireAuthenticatedUser()
         .AddRequirements(new OrgRoleRequirement(OrgRole.Admin)));

    options.AddPolicy("OrgOwner", p =>
        p.AddAuthenticationSchemes(CallerAuthenticationHandler.SchemeName)
         .RequireAuthenticatedUser()
         .AddRequirements(new OrgRoleRequirement(OrgRole.Owner)));
});

// Register handler
builder.Services.AddScoped<IAuthorizationHandler, OrgRoleAuthorizationHandler>();
builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, ProblemDetailsAuthorizationMiddlewareResultHandler>();


// Swagger + OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ProblemDetails
builder.Services.AddProblemDetails();

// JSON options
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Middleware
builder.Services.AddTransient<ExceptionHandlingMiddleware>();

// DbContext
builder.Services.AddDbContext<WorkflowDbContext>(opt =>
{
    var cs = builder.Configuration.GetConnectionString("WorkflowDb");
    opt.UseNpgsql(cs);
});

// Unit of Work
builder.Services.AddScoped<IUnitOfWork, EfUnitOfWork>();

// Repositories
builder.Services.AddScoped<IOrganizationRepository, EfOrganizationRepository>();
builder.Services.AddScoped<IProjectRepository, EfProjectRepository>();
builder.Services.AddScoped<ITaskRepository, EfTaskRepository>();
builder.Services.AddScoped<IUserRepository, EfUserRepository>();
builder.Services.AddScoped<IOrgMemberRepository, EfOrgMemberRepository>();
builder.Services.AddScoped<IOrgMemberAuditRepository, EfOrgMemberAuditRepository>();
builder.Services.AddScoped<IOrgInvitationRepository, EfOrgInvitationRepository>();

var app = builder.Build();

// IMPORTANT: Exception middleware should be as early as possible
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.InjectJavascript("/swagger-user.js");
});

// Endpoints
app.MapOrganizationEndpoints();
app.MapProjectEndpoints();
app.MapTaskEndpoints();
app.MapUserEndpoints();
app.MapOrgMemberEndpoints();
app.MapOrgInvitationEndpoints();

app.Run();
