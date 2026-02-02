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

        // POST /orgs  (BOOTSTRAP OWNER)
        group.MapPost("", async (
            [FromBody] CreateOrganizationRequest req,
            HttpContext http,
            IOrganizationRepository orgs,
            IOrgMemberRepository members,
            IUserRepository users,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            // Read acting user from JWT
            var rawUserId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(rawUserId) || !Guid.TryParse(rawUserId, out var actingUserId) || actingUserId == Guid.Empty)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "Missing or invalid user identity in token.");
            }

            // Ensure caller exists as a User
            var actingUser = await users.GetAsync(actingUserId, ct);
            if (actingUser is null)
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status401Unauthorized,
                    title: "Unauthorized",
                    detail: "User not found for this token.");
            }

            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Organization name is required." });

            // Create org
            var org = new Organization(Guid.NewGuid(), req.Name.Trim());
            await orgs.AddAsync(org, ct);

            // BOOTSTRAP: creator becomes Owner
            var ownerMember = OrgMember.Create(org.Id, actingUserId, OrgRole.Owner);
            await members.AddAsync(ownerMember, ct);

            await uow.SaveChangesAsync(ct);

            return Results.Created($"/orgs/{org.Id}", new
            {
                id = org.Id,
                name = org.Name,
                ownerUserId = actingUserId,
                ownerRole = OrgRole.Owner.ToString()
            });
        });

        // GET /orgs
        group.MapGet("", async (IOrganizationRepository orgs, CancellationToken ct) =>
        {
            var list = await orgs.ListAsync(ct);
            return Results.Ok(list.Select(o => new { o.Id, o.Name }));
        });

        // GET /orgs/{orgId}
        group.MapGet("/{orgId:guid}", async (Guid orgId, IOrganizationRepository orgs, CancellationToken ct) =>
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
