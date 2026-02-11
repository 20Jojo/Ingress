using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Users;
using Workflow.Domain.Organizations;

namespace Workflow.Api.Endpoints;

public static class OrgInvitationEndpoints
{
    public static IEndpointRouteBuilder MapOrgInvitationEndpoints(this IEndpointRouteBuilder app)
    {
        // Org-scoped (Admin/Owner can invite + list)
        var orgGroup = app.MapGroup("/orgs/{orgId:guid}/invitations")
            .WithTags("Org Invitations")
            .RequireAuthorization("OrgAdmin");

        // POST /orgs/{orgId}/invitations  (Admin/Owner can invite; only Owner can invite Owner)
        orgGroup.MapPost("", async (
            HttpContext ctx,
            Guid orgId,
            [FromBody] CreateInvitationRequest req,
            IOrganizationRepository orgs,
            IUserRepository users,
            IOrgMemberRepository members,
            IOrgInvitationRepository invites,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            // JWT caller id
            if (!TryGetActorUserId(ctx, out var actorUserId))
                return UnauthorizedMissingBearer();

            // Ensure org exists
            var org = await orgs.GetAsync(orgId, ct);
            if (org is null)
                return Results.NotFound(new { message = "Organization not found." });

            // Ensure actor exists as a user
            var actor = await users.GetAsync(actorUserId, ct);
            if (actor is null)
                return Results.Unauthorized();

            // Ensure actor is at least Admin in this org
            var actorRole = await members.GetRoleAsync(orgId, actorUserId, ct);
            if (actorRole is null)
                return Forbidden("Caller is not a member of this organization.");

            if (actorRole != OrgRole.Owner && actorRole != OrgRole.Admin)
                return Forbidden("Only Admin/Owner can invite members.");

            if (string.IsNullOrWhiteSpace(req.Email))
                return Results.BadRequest(new { message = "Email is required." });

            if (!ParseRoleOrBadRequest(req.Role, out var parsedRole, out var badRole))
                return badRole!;

            // Only Owner can invite an Owner
            if (parsedRole == OrgRole.Owner && actorRole != OrgRole.Owner)
                return Forbidden("Only an Owner can invite another Owner.");

            // Create token
            var token = Convert.ToHexString(Guid.NewGuid().ToByteArray()).ToLowerInvariant(); // 32 chars
            var nowUtc = DateTimeOffset.UtcNow;
            var expiresUtc = nowUtc.AddDays(7);

            var invitation = new OrgInvitation(
                id: Guid.NewGuid(),
                organizationId: orgId,
                email: OrgInvitation.NormalizeEmail(req.Email),
                role: parsedRole,
                token: token,
                expiresAtUtc: expiresUtc,
                createdByUserId: actorUserId,
                createdAtUtc: nowUtc,
                acceptedByUserId: null,
                acceptedAtUtc: null,
                revokedByUserId: null,
                revokedAtUtc: null
            );

            await invites.AddAsync(invitation, ct);
            await uow.SaveChangesAsync(ct);

            return Results.Created($"/invitations/{invitation.Token}/accept", new
            {
                invitation.Id,
                invitation.OrganizationId,
                invitation.Email,
                Role = invitation.Role.ToString(),
                invitation.Token,
                invitation.ExpiresAtUtc
            });
        });

        // GET /orgs/{orgId}/invitations  (Admin/Owner list)
        orgGroup.MapGet("", async (
            HttpContext ctx,
            Guid orgId,
            IOrgMemberRepository members,
            IOrgInvitationRepository invites,
            CancellationToken ct) =>
        {
            if (!TryGetActorUserId(ctx, out var actorUserId))
                return UnauthorizedMissingBearer();

            var actorRole = await members.GetRoleAsync(orgId, actorUserId, ct);
            if (actorRole is null)
                return Forbidden("Caller is not a member of this organization.");

            if (actorRole != OrgRole.Owner && actorRole != OrgRole.Admin)
                return Forbidden("Only Admin/Owner can list invitations.");

            var list = await invites.ListByOrgAsync(orgId, ct);
            return Results.Ok(list.Select(i => new
            {
                i.Id,
                i.OrganizationId,
                i.Email,
                Role = i.Role.ToString(),
                i.Token,
                i.ExpiresAtUtc,
                i.CreatedByUserId,
                i.CreatedAtUtc,
                i.AcceptedByUserId,
                i.AcceptedAtUtc,
                i.RevokedByUserId,
                i.RevokedAtUtc
            }));
        });

        // Accept invite (JWT authenticated user)
        // POST /invitations/{token}/accept
        app.MapPost("/invitations/{token}/accept", async (
            HttpContext ctx,
            string token,
            IUserRepository users,
            IOrgInvitationRepository invites,
            IOrgMemberRepository members,
            IOrgMemberAuditRepository audit,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            // Requires Bearer token (FallbackPolicy already requires auth)
            if (!TryGetActorUserId(ctx, out var actorUserId))
                return UnauthorizedMissingBearer();

            var actor = await users.GetAsync(actorUserId, ct);
            if (actor is null)
                return Results.Unauthorized();

            var invite = await invites.GetByTokenAsync(token, ct);
            if (invite is null)
                return Results.NotFound(new { message = "Invitation not found." });

            if (invite.IsRevoked) return Results.Conflict(new { message = "Invitation has been revoked." });
            if (invite.IsAccepted) return Results.Conflict(new { message = "Invitation has already been accepted." });
            if (invite.IsExpired(DateTimeOffset.UtcNow)) return Results.Conflict(new { message = "Invitation has expired." });

            // Must match invite email
            if (!string.Equals(invite.Email, OrgInvitation.NormalizeEmail(actor.Email), StringComparison.OrdinalIgnoreCase))
                return Forbidden("This invitation is not for your email.");

            // If already member, mark accepted anyway
            var existingRole = await members.GetRoleAsync(invite.OrganizationId, actorUserId, ct);
            if (existingRole is not null)
            {
                await invites.MarkAcceptedAsync(invite.Id, actorUserId, DateTimeOffset.UtcNow, ct);
                await uow.SaveChangesAsync(ct);

                return Results.Ok(new
                {
                    message = "Already a member.",
                    organizationId = invite.OrganizationId,
                    role = existingRole.ToString()
                });
            }

            // Create membership
            var member = OrgMember.Create(invite.OrganizationId, actorUserId, invite.Role);
            await members.AddAsync(member, ct);

            await audit.AddAsync(
                invite.OrganizationId,
                actorUserId,
                actorUserId,
                OrgMemberAuditAction.Added,
                fromRole: null,
                toRole: invite.Role,
                occurredAtUtc: DateTimeOffset.UtcNow,
                ct);

            await invites.MarkAcceptedAsync(invite.Id, actorUserId, DateTimeOffset.UtcNow, ct);
            await uow.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                organizationId = invite.OrganizationId,
                userId = actorUserId,
                role = invite.Role.ToString()
            });
        });

        return app;
    }

    public sealed record CreateInvitationRequest(string Email, string? Role);

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    private static bool TryGetActorUserId(HttpContext ctx, out Guid userId)
    {
        userId = Guid.Empty;

        var raw = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId) && userId != Guid.Empty;
    }

    private static bool ParseRoleOrBadRequest(string? raw, out OrgRole role, out IResult? bad)
    {
        bad = null;

        if (string.IsNullOrWhiteSpace(raw))
        {
            role = OrgRole.Member;
            return true;
        }

        if (!Enum.TryParse(raw.Trim(), ignoreCase: true, out role))
        {
            bad = Results.BadRequest(new { message = "Invalid role. Use Owner, Admin, or Member." });
            return false;
        }

        return true;
    }

    private static IResult Forbidden(string detail)
        => Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Forbidden", detail: detail);

    private static IResult UnauthorizedMissingBearer()
        => Results.Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Unauthorized", detail: "Missing or invalid Bearer token.");
}
