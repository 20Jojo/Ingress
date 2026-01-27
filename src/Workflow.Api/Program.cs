using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Swashbuckle.AspNetCore.SwaggerGen;

using Workflow.Api.Endpoints;
using Workflow.Api.Middleware;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Projects;
using Workflow.Application.Tasks;
using Workflow.Application.Users;
using Workflow.Infrastructure.Persistence;
using Workflow.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

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

// Repositories (scoped)
builder.Services.AddScoped<IOrganizationRepository, EfOrganizationRepository>();
builder.Services.AddScoped<IProjectRepository, EfProjectRepository>();
builder.Services.AddScoped<ITaskRepository, EfTaskRepository>();
builder.Services.AddScoped<IUserRepository, EfUserRepository>();
builder.Services.AddScoped<IOrgMemberRepository, EfOrgMemberRepository>();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseStaticFiles();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.InjectJavascript("/swagger-user.js");
});

app.MapOrganizationEndpoints();
app.MapProjectEndpoints();
app.MapTaskEndpoints();
app.MapUserEndpoints();
app.MapOrgMemberEndpoints();

app.Run();
