using Microsoft.AspNetCore.Mvc;
using Workflow.Api.Common;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Users;
using Workflow.Domain.Organizations;

namespace Workflow.Api.Endpoints;

public static class OrgInvitationEndpoints
{
    public static IEndpointRouteBuilder MapOrgInvitationEndpoints(this IEndpointRouteBuilder app)
    {
        // Org-scoped
        var orgGroup = app.MapGroup("/orgs/{orgId:guid}/invitations").WithTags("Org Invitations");

        // Admin/Owner can invite; only Owner can invite Owner
        orgGroup.MapPost("", async (
            HttpContext ctx,
            Guid orgId,
            [FromBody] CreateInvitationRequest req,
            IOrganizationRepository orgs,
            IUserRepository users,
            IOrgMemberRepository members,
            IOrgInvitationRepository invites,
            IOrgMemberAuditRepository audit,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            var auth = await OrgAuth.RequireOrgRoleAsync(ctx, orgId, members, OrgRole.Admin, ct);
            if (!auth.ok) return auth.problem!;

            if (!OrgAuth.TryGetCallerId(ctx, out var actorUserId))
                return OrgAuth.UnauthorizedMissingCaller();

            var org = await orgs.GetAsync(orgId, ct);
            if (org is null) return Results.NotFound(new { message = "Organization not found." });

            var actor = await users.GetAsync(actorUserId, ct);
            if (actor is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(req.Email))
                return Results.BadRequest(new { message = "Email is required." });

            var requestedRole = ParseRoleOrBadRequest(req.Role, out var parsedRole, out var bad);
            if (!requestedRole) return bad!;

            // Only Owner can invite an Owner
            if (parsedRole == OrgRole.Owner && auth.role!.Value != OrgRole.Owner)
                return Results.Problem(statusCode: 403, title: "Forbidden", detail: "Only an Owner can invite another Owner.");

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

            // Audit as "Added" is not correct here, so we do no member audit yet.
            // (Member audit should happen when accepted.)

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

        // Admin/Owner list invites
        orgGroup.MapGet("", async (
            HttpContext ctx,
            Guid orgId,
            IOrgMemberRepository members,
            IOrgInvitationRepository invites,
            CancellationToken ct) =>
        {
            var auth = await OrgAuth.RequireOrgRoleAsync(ctx, orgId, members, OrgRole.Admin, ct);
            if (!auth.ok) return auth.problem!;

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

        // Public-ish accept (still requires X-User-Id)
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
            if (!OrgAuth.TryGetCallerId(ctx, out var actorUserId))
                return OrgAuth.UnauthorizedMissingCaller();

            var actor = await users.GetAsync(actorUserId, ct);
            if (actor is null) return Results.Unauthorized();

            var invite = await invites.GetByTokenAsync(token, ct);
            if (invite is null) return Results.NotFound(new { message = "Invitation not found." });

            if (invite.IsRevoked) return Results.Conflict(new { message = "Invitation has been revoked." });
            if (invite.IsAccepted) return Results.Conflict(new { message = "Invitation has already been accepted." });
            if (invite.IsExpired(DateTimeOffset.UtcNow)) return Results.Conflict(new { message = "Invitation has expired." });

            // Must match email
            if (!string.Equals(invite.Email, OrgInvitation.NormalizeEmail(actor.Email), StringComparison.OrdinalIgnoreCase))
                return Results.Problem(statusCode: 403, title: "Forbidden", detail: "This invitation is not for your email.");

            // If already a member (active), return OK
            var existingRole = await members.GetRoleAsync(invite.OrganizationId, actorUserId, ct);
            if (existingRole is not null)
            {
                // mark accepted anyway
                await invites.MarkAcceptedAsync(invite.Id, actorUserId, DateTimeOffset.UtcNow, ct);
                await uow.SaveChangesAsync(ct);
                return Results.Ok(new { message = "Already a member.", organizationId = invite.OrganizationId, role = existingRole.ToString() });
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
}
