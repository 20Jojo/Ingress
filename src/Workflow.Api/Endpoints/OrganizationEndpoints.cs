using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Users;
using Workflow.Domain.Organizations;

namespace Workflow.Api.Endpoints;

public static class OrganizationEndpoints
{
    public static IEndpointRouteBuilder MapOrganizationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orgs").WithTags("Organizations");

        // POST /orgs  (creator becomes OWNER)
        group.MapPost("", async (
            [FromBody] CreateOrganizationRequest req,
            HttpContext http,
            IOrganizationRepository orgs,
            IOrgMemberRepository members,
            IUserRepository users,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            var rawUserId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(rawUserId, out var userId))
            {
                return Results.Unauthorized();
            }

            var user = await users.GetAsync(userId, ct);
            if (user is null)
                return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Organization name is required." });

            var org = new Organization(Guid.NewGuid(), req.Name.Trim());
            await orgs.AddAsync(org, ct);

            var owner = OrgMember.Create(org.Id, userId, OrgRole.Owner);
            await members.AddAsync(owner, ct);

            await uow.SaveChangesAsync(ct);

            return Results.Created($"/orgs/{org.Id}", new
            {
                org.Id,
                org.Name
            });
        });

        // GET /orgs
        group.MapGet("", async (
            IOrganizationRepository orgs,
            CancellationToken ct) =>
        {
            var list = await orgs.ListAsync(ct);
            return Results.Ok(list.Select(o => new { o.Id, o.Name }));
        });

        // GET /orgs/{orgId}
        group.MapGet("/{orgId:guid}", async (
            Guid orgId,
            IOrganizationRepository orgs,
            CancellationToken ct) =>
        {
            var org = await orgs.GetAsync(orgId, ct);
            return org is null
                ? Results.NotFound(new { message = "Organization not found." })
                : Results.Ok(new { org.Id, org.Name });
        });

        return app;
    }

    public sealed record CreateOrganizationRequest(string Name);
}
