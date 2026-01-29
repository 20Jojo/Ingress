using Microsoft.EntityFrameworkCore;
using Workflow.Application.Organizations;
using Workflow.Domain.Organizations;
using Workflow.Infrastructure.Persistence;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Repositories;

public sealed class EfOrgInvitationRepository : IOrgInvitationRepository
{
    private readonly WorkflowDbContext _db;
    public EfOrgInvitationRepository(WorkflowDbContext db) => _db = db;

    public async Task AddAsync(OrgInvitation invitation, CancellationToken ct)
    {
        _db.OrgInvitations.Add(new OrgInvitationEntity
        {
            Id = invitation.Id,
            OrganizationId = invitation.OrganizationId,
            Email = invitation.Email,
            Role = (int)invitation.Role,
            Token = invitation.Token,
            ExpiresAtUtc = invitation.ExpiresAtUtc,
            CreatedByUserId = invitation.CreatedByUserId,
            CreatedAtUtc = invitation.CreatedAtUtc,
            AcceptedByUserId = invitation.AcceptedByUserId,
            AcceptedAtUtc = invitation.AcceptedAtUtc,
            RevokedByUserId = invitation.RevokedByUserId,
            RevokedAtUtc = invitation.RevokedAtUtc
        });

        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<OrgInvitation>> ListByOrgAsync(Guid orgId, CancellationToken ct)
    {
        var list = await _db.OrgInvitations.AsNoTracking()
            .Where(x => x.OrganizationId == orgId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(ct);

        return list.Select(Map).ToList();
    }

    public async Task<OrgInvitation?> GetByTokenAsync(string token, CancellationToken ct)
    {
        var t = token.Trim();
        var e = await _db.OrgInvitations.AsNoTracking().FirstOrDefaultAsync(x => x.Token == t, ct);
        return e is null ? null : Map(e);
    }

    public async Task MarkAcceptedAsync(Guid invitationId, Guid acceptedByUserId, DateTimeOffset acceptedAtUtc, CancellationToken ct)
    {
        var e = await _db.OrgInvitations.FirstOrDefaultAsync(x => x.Id == invitationId, ct);
        if (e is null) return;

        e.AcceptedByUserId = acceptedByUserId;
        e.AcceptedAtUtc = acceptedAtUtc;

        await _db.SaveChangesAsync(ct);
    }

    public async Task MarkRevokedAsync(Guid invitationId, Guid revokedByUserId, DateTimeOffset revokedAtUtc, CancellationToken ct)
    {
        var e = await _db.OrgInvitations.FirstOrDefaultAsync(x => x.Id == invitationId, ct);
        if (e is null) return;

        e.RevokedByUserId = revokedByUserId;
        e.RevokedAtUtc = revokedAtUtc;

        await _db.SaveChangesAsync(ct);
    }

    private static OrgInvitation Map(OrgInvitationEntity x) =>
        new(
            x.Id,
            x.OrganizationId,
            x.Email,
            (OrgRole)x.Role,
            x.Token,
            x.ExpiresAtUtc,
            x.CreatedByUserId,
            x.CreatedAtUtc,
            x.AcceptedByUserId,
            x.AcceptedAtUtc,
            x.RevokedByUserId,
            x.RevokedAtUtc
        );
}
