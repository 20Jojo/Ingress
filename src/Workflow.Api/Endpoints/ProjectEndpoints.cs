using Microsoft.AspNetCore.Mvc;
using MassTransit;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Projects;
using Workflow.Api.Messaging.Contracts;
using Workflow.Domain.Projects;

namespace Workflow.Api.Endpoints;

public static class ProjectEndpoints
{
    public static IEndpointRouteBuilder MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app
            .MapGroup("/orgs/{orgId:guid}/projects")
            .WithTags("Projects");

        // Member+ can list projects
        group.MapGet("", async (
            Guid orgId,
            IProjectRepository projects,
            CancellationToken ct) =>
        {
            var list = await projects.ListByOrganizationAsync(orgId, ct);
            return Results.Ok(list.Select(p => new { p.Id, p.OrganizationId, p.Name }));
        })
        .RequireAuthorization("OrgMember");

        // Member+ can get single project in org
        group.MapGet("/{projectId:guid}", async (
            Guid orgId,
            Guid projectId,
            IProjectRepository projects,
            CancellationToken ct) =>
        {
            var project = await projects.GetAsync(projectId, ct);
            if (project is null || project.OrganizationId != orgId)
                return Results.NotFound(new { message = "Project not found." });

            return Results.Ok(new { project.Id, project.OrganizationId, project.Name });
        })
        .RequireAuthorization("OrgMember");

        // Admin/Owner only: create project
        group.MapPost("", async (
            Guid orgId,
            [FromBody] CreateProjectRequest req,
            IOrganizationRepository orgs,
            IProjectRepository projects,
            IUnitOfWork uow,
            IPublishEndpoint publish,
            CancellationToken ct) =>
        {
            var org = await orgs.GetAsync(orgId, ct);
            if (org is null)
                return Results.NotFound(new { message = "Organization not found." });

            var project = new Project(Guid.NewGuid(), orgId, req.Name);
            await projects.AddAsync(project, ct);
            await uow.SaveChangesAsync(ct);
            await publish.Publish(new ProjectCreated(
                project.Id,
                project.OrganizationId,
                project.Name,
                DateTimeOffset.UtcNow
            ), ct);

            return Results.Created($"/orgs/{orgId}/projects/{project.Id}", new
            {
                project.Id,
                project.OrganizationId,
                project.Name
            });
        })
        .RequireAuthorization("OrgAdmin");

        return app;
    }

    public sealed record CreateProjectRequest(string Name);
}
