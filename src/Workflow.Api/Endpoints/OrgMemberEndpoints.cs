using Microsoft.AspNetCore.Mvc;
using Workflow.Api.Common;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Users;
using Workflow.Domain.Organizations;

namespace Workflow.Api.Endpoints;

public static class OrgMemberEndpoints
{
    public static IEndpointRouteBuilder MapOrgMemberEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orgs/{orgId:guid}/members").WithTags("Org Members");

        // Admin/Owner only: add member
        group.MapPost("", async (
            HttpContext ctx,
            Guid orgId,
            [FromBody] AddMemberRequest req,
            IOrganizationRepository orgs,
            IUserRepository users,
            IOrgMemberRepository members,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            var auth = await OrgAuth.RequireOrgRoleAsync(ctx, orgId, members, OrgRole.Admin, ct);
            if (!auth.ok) return auth.problem!;
            var actingRole = auth.role!.Value;

            var org = await orgs.GetAsync(orgId, ct);
            if (org is null) return Results.NotFound(new { message = "Organization not found." });

            var user = await users.GetAsync(req.UserId, ct);
            if (user is null) return Results.NotFound(new { message = "User not found." });

            // Parse requested role (default Member)
            var roleRaw = req.Role?.Trim();
            OrgRole requestedRole;

            if (string.IsNullOrWhiteSpace(roleRaw))
            {
                requestedRole = OrgRole.Member;
            }
            else if (!Enum.TryParse(roleRaw, ignoreCase: true, out requestedRole))
            {
                return Results.BadRequest(new { message = "Invalid role. Use Owner, Admin, or Member." });
            }

            // Only Owners can add Owners
            if (requestedRole == OrgRole.Owner && actingRole != OrgRole.Owner)
                return Results.Problem(
                    statusCode: StatusCodes.Status403Forbidden,
                    title: "Forbidden",
                    detail: "Only an Owner can add another Owner.");
            // Prevent duplicate membership
            var exists = await members.ExistsAsync(orgId, req.UserId, ct);
            if (exists) return Results.Conflict(new { message = "User is already a member of this organization." });

            var member = OrgMember.Create(orgId, req.UserId, requestedRole);
            await members.AddAsync(member, ct);
            await uow.SaveChangesAsync(ct);

            return Results.Created($"/orgs/{orgId}/members", new
            {
                member.OrganizationId,
                member.UserId,
                Role = member.Role.ToString(),
                member.JoinedAt
            });
        });

        // Admin/Owner only: list members
        group.MapGet("", async (
            HttpContext ctx,
            Guid orgId,
            IOrgMemberRepository members,
            CancellationToken ct) =>
        {
            var auth = await OrgAuth.RequireOrgRoleAsync(ctx, orgId, members, OrgRole.Admin, ct);
            if (!auth.ok) return auth.problem!;

            var list = await members.ListByOrgAsync(orgId, ct);
            return Results.Ok(list.Select(m => new
            {
                m.OrganizationId,
                m.UserId,
                Role = m.Role.ToString(),
                m.JoinedAt
            }));
        });

        return app;
    }

    public sealed record AddMemberRequest(Guid UserId, string? Role);
}
