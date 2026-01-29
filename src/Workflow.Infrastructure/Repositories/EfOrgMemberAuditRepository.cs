using Microsoft.EntityFrameworkCore;
using Workflow.Application.Organizations;
using Workflow.Domain.Organizations;
using Workflow.Infrastructure.Persistence;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Repositories;

public sealed class EfOrgMemberAuditRepository : IOrgMemberAuditRepository
{
    private readonly WorkflowDbContext _db;

    public EfOrgMemberAuditRepository(WorkflowDbContext db) => _db = db;

    public async Task AddAsync(
        Guid orgId,
        Guid actorUserId,
        Guid targetUserId,
        OrgMemberAuditAction action,
        OrgRole? fromRole,
        OrgRole? toRole,
        DateTimeOffset occurredAtUtc,
        CancellationToken ct)
    {
        var e = new OrgMemberAuditEntity
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            ActorUserId = actorUserId,
            TargetUserId = targetUserId,
            Action = (int)action,
            FromRole = fromRole is null ? null : (int)fromRole.Value,
            ToRole = toRole is null ? null : (int)toRole.Value,
            OccurredAt = occurredAtUtc
        };

        _db.OrgMemberAudits.Add(e);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<OrgMemberAuditRecord>> ListByOrgAsync(
        Guid orgId,
        int take,
        CancellationToken ct)
    {
        var list = await _db.OrgMemberAudits.AsNoTracking()
            .Where(x => x.OrganizationId == orgId)
            .OrderByDescending(x => x.OccurredAt)
            .Take(take)
            .ToListAsync(ct);

        return list.Select(x => new OrgMemberAuditRecord(
                x.Id,
                x.OrganizationId,
                x.ActorUserId,
                x.TargetUserId,
                (OrgMemberAuditAction)x.Action,
                x.FromRole is null ? null : (OrgRole?)((OrgRole)x.FromRole.Value),
                x.ToRole is null ? null : (OrgRole?)((OrgRole)x.ToRole.Value),
                x.OccurredAt
            ))
            .ToList();
    }
}
