using Microsoft.AspNetCore.Mvc;
using Workflow.Api.Common;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Projects;
using Workflow.Domain.Organizations;
using Workflow.Domain.Projects;

namespace Workflow.Api.Endpoints;

public static class ProjectEndpoints
{
    public static IEndpointRouteBuilder MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orgs/{orgId:guid}/projects").WithTags("Projects");

        // Member+ can list projects
        group.MapGet("", async (
            HttpContext ctx,
            Guid orgId,
            IOrgMemberRepository members,
            IProjectRepository projects,
            CancellationToken ct) =>
        {
            var auth = await OrgAuth.RequireMemberAsync(ctx, orgId, members, ct);
            if (!auth.ok) return auth.problem!;

            var list = await projects.ListByOrganizationAsync(orgId, ct);
            return Results.Ok(list.Select(p => new { p.Id, p.OrganizationId, p.Name }));
        });

        // Admin/Owner only: create project
        group.MapPost("", async (
            HttpContext ctx,
            Guid orgId,
            [FromBody] CreateProjectRequest req,
            IOrgMemberRepository members,
            IOrganizationRepository orgs,
            IProjectRepository projects,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            var auth = await OrgAuth.RequireOrgRoleAsync(ctx, orgId, members, OrgRole.Admin, ct);
            if (!auth.ok) return auth.problem!;

            var org = await orgs.GetAsync(orgId, ct);
            if (org is null)
                return Results.NotFound(new { message = "Organization not found." });

            var project = new Project(Guid.NewGuid(), orgId, req.Name);
            await projects.AddAsync(project, ct);
            await uow.SaveChangesAsync(ct);

            return Results.Created($"/orgs/{orgId}/projects/{project.Id}", new
            {
                project.Id,
                project.OrganizationId,
                project.Name
            });
        });

        return app;
    }

    public sealed record CreateProjectRequest(string Name);
}
