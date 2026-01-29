using Microsoft.AspNetCore.Mvc;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Users;
using Workflow.Domain.Organizations;

namespace Workflow.Api.Endpoints;

public static class OrgMemberEndpoints
{
    public static IEndpointRouteBuilder MapOrgMemberEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orgs/{orgId:guid}/members")
            .WithTags("Org Members");

        // ─────────────────────────────────────────────
        // Admin+ : list members
        // ─────────────────────────────────────────────
        group.MapGet("", async (
            Guid orgId,
            IOrgMemberRepository members,
            CancellationToken ct) =>
        {
            var list = await members.ListByOrgAsync(orgId, ct);

            return Results.Ok(list.Select(m => new
            {
                m.OrganizationId,
                m.UserId,
                Role = m.Role.ToString(),
                m.JoinedAt
            }));
        })
        .RequireAuthorization("OrgAdmin");

        // ─────────────────────────────────────────────
        // Admin+ : add member
        // Only Owner may add another Owner
        // ─────────────────────────────────────────────
        group.MapPost("", async (
            HttpContext ctx,
            Guid orgId,
            [FromBody] AddMemberRequest req,
            IUserRepository users,
            IOrgMemberRepository members,
            IOrgMemberAuditRepository audit,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            var actorUserId = GetActorUserId(ctx);

            var actingRole = await members.GetRoleAsync(orgId, actorUserId, ct);
            if (actingRole is null)
                return Forbidden("Caller is not a member of this organization.");

            var user = await users.GetAsync(req.UserId, ct);
            if (user is null)
                return Results.NotFound(new { message = "User not found." });

            // Parse role
            if (!TryParseRole(req.Role, out var requestedRole, out var badRoleProblem))
                return badRoleProblem!;

            // Only Owner may add Owner
            if (requestedRole == OrgRole.Owner && actingRole != OrgRole.Owner)
                return Forbidden("Only an Owner can add another Owner.");

            // Friendly duplicate membership
            if (await members.ExistsAsync(orgId, req.UserId, ct))
                return Results.Conflict(new { message = "User is already a member of this organization." });

            var member = OrgMember.Create(orgId, req.UserId, requestedRole);
            await members.AddAsync(member, ct);

            await audit.AddAsync(
                orgId,
                actorUserId,
                req.UserId,
                OrgMemberAuditAction.Added,
                fromRole: null,
                toRole: requestedRole,
                occurredAtUtc: DateTimeOffset.UtcNow,
                ct);

            await uow.SaveChangesAsync(ct);

            return Results.Created($"/orgs/{orgId}/members", new
            {
                member.OrganizationId,
                member.UserId,
                Role = member.Role.ToString(),
                member.JoinedAt
            });
        })
        .RequireAuthorization("OrgAdmin");

        // ─────────────────────────────────────────────
        // Admin+ : change role
        // BUT: only Owner can actually change roles (we enforce with polite messages)
        // Enforces ≥ 1 owner invariant
        // ─────────────────────────────────────────────
        group.MapPatch("/{userId:guid}/role", async (
            HttpContext ctx,
            Guid orgId,
            Guid userId,
            [FromBody] ChangeRoleRequest req,
            IOrgMemberRepository members,
            IOrgMemberAuditRepository audit,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            var actorUserId = GetActorUserId(ctx);

            var actorRole = await members.GetRoleAsync(orgId, actorUserId, ct);
            if (actorRole is null)
                return Forbidden("Caller is not a member of this organization.");

            var currentRole = await members.GetRoleAsync(orgId, userId, ct);
            if (currentRole is null)
                return Results.NotFound(new { message = "Target user is not a member of this organization." });

            if (!TryParseRole(req.Role, out var newRole, out var badRoleProblem))
                return badRoleProblem!;

            // Only Owner can change roles (but we let Admin reach here to return a nice message)
            if (actorRole != OrgRole.Owner)
            {
                // If they specifically tried to make someone Owner, explain that too
                if (newRole == OrgRole.Owner)
                    return Forbidden("Only an Owner can promote someone to Owner.");

                return Forbidden("Only an Owner can change member roles.");
            }

            // Optional: prevent pointless updates
            if (currentRole.Value == newRole)
                return Results.Ok(new { organizationId = orgId, userId, role = newRole.ToString() });

            // Invariant: org must always have ≥ 1 owner
            if (currentRole == OrgRole.Owner && newRole != OrgRole.Owner)
            {
                var owners = await members.CountOwnersAsync(orgId, ct);
                if (owners <= 1)
                {
                    return Conflict(
                        "You can’t demote the last Owner. Promote another Owner first, then retry.");
                }
            }

            await members.UpdateRoleAsync(orgId, userId, newRole, ct);

            await audit.AddAsync(
                orgId,
                actorUserId,
                userId,
                OrgMemberAuditAction.RoleChanged,
                fromRole: currentRole,
                toRole: newRole,
                occurredAtUtc: DateTimeOffset.UtcNow,
                ct);

            await uow.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                organizationId = orgId,
                userId,
                role = newRole.ToString()
            });
        })
        .RequireAuthorization("OrgAdmin"); // <- IMPORTANT: NOT OrgOwner

        // ─────────────────────────────────────────────
        // Admin+ : remove member (soft delete)
        // BUT: only Owner can actually remove (we enforce with polite messages)
        // Enforces ≥ 1 owner invariant
        // ─────────────────────────────────────────────
        group.MapDelete("/{userId:guid}", async (
            HttpContext ctx,
            Guid orgId,
            Guid userId,
            IOrgMemberRepository members,
            IOrgMemberAuditRepository audit,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            var actorUserId = GetActorUserId(ctx);

            var actorRole = await members.GetRoleAsync(orgId, actorUserId, ct);
            if (actorRole is null)
                return Forbidden("Caller is not a member of this organization.");

            var targetRole = await members.GetRoleAsync(orgId, userId, ct);
            if (targetRole is null)
                return Results.NotFound(new { message = "Target user is not a member of this organization." });

            // Only Owner can remove members (but we let Admin reach here to return a nice message)
            if (actorRole != OrgRole.Owner)
                return Forbidden("Only an Owner can remove members.");

            // Invariant: org must always have ≥ 1 owner
            if (targetRole == OrgRole.Owner)
            {
                var owners = await members.CountOwnersAsync(orgId, ct);
                if (owners <= 1)
                {
                    return Conflict(
                        "You can’t remove the last Owner. Promote another Owner first, then retry.");
                }
            }

            await members.RemoveAsync(orgId, userId, actorUserId, ct);

            await audit.AddAsync(
                orgId,
                actorUserId,
                userId,
                OrgMemberAuditAction.Removed,
                fromRole: targetRole,
                toRole: null,
                occurredAtUtc: DateTimeOffset.UtcNow,
                ct);

            await uow.SaveChangesAsync(ct);

            return Results.NoContent();
        })
        .RequireAuthorization("OrgAdmin"); // <- IMPORTANT: NOT OrgOwner

        return app;
    }

    public sealed record AddMemberRequest(Guid UserId, string? Role);
    public sealed record ChangeRoleRequest(string? Role);

    // ─────────────────────────────────────────────
    // helpers
    // ─────────────────────────────────────────────
    private static Guid GetActorUserId(HttpContext ctx)
        => Guid.Parse(ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    private static bool TryParseRole(string? raw, out OrgRole role, out IResult? problem)
    {
        problem = null;

        var roleRaw = raw?.Trim();
        if (string.IsNullOrWhiteSpace(roleRaw))
        {
            role = OrgRole.Member;
            return true;
        }

        if (!Enum.TryParse(roleRaw, true, out role))
        {
            role = OrgRole.Member;
            problem = Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bad Request",
                detail: "Invalid role. Use Owner, Admin, or Member.");
            return false;
        }

        return true;
    }

    private static IResult Forbidden(string detail)
        => Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Forbidden", detail: detail);

    private static IResult Conflict(string detail)
        => Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflict", detail: detail);
}
