using Microsoft.EntityFrameworkCore;
using Workflow.Application.Organizations;
using Workflow.Domain.Organizations;
using Workflow.Infrastructure.Persistence;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Repositories;

public sealed class EfOrgMemberRepository : IOrgMemberRepository
{
    private readonly WorkflowDbContext _db;

    public EfOrgMemberRepository(WorkflowDbContext db) => _db = db;

    public Task AddAsync(OrgMember member, CancellationToken ct)
    {
        var entity = new OrgMemberEntity
        {
            OrganizationId = member.OrganizationId,
            UserId = member.UserId,
            Role = (int)member.Role,
            JoinedAt = member.JoinedAt,

            IsDeleted = false,
            DeletedAtUtc = null,
            DeletedByUserId = null
        };

        _db.OrgMembers.Add(entity);
        return Task.CompletedTask; // UoW commits
    }

    public async Task<bool> ExistsAsync(Guid orgId, Guid userId, CancellationToken ct)
        => await _db.OrgMembers.AsNoTracking()
            .AnyAsync(x =>
                x.OrganizationId == orgId &&
                x.UserId == userId &&
                !x.IsDeleted, ct);

    public async Task<IReadOnlyList<OrgMember>> ListByOrgAsync(Guid orgId, CancellationToken ct)
    {
        var list = await _db.OrgMembers.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && !x.IsDeleted)
            .OrderBy(x => x.JoinedAt)
            .ToListAsync(ct);

        return list
            .Select(x => new OrgMember(x.OrganizationId, x.UserId, (OrgRole)x.Role, x.JoinedAt))
            .ToList();
    }

    public async Task<OrgRole?> GetRoleAsync(Guid orgId, Guid userId, CancellationToken ct)
    {
        var roleInt = await _db.OrgMembers.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && x.UserId == userId && !x.IsDeleted)
            .Select(x => (int?)x.Role)
            .FirstOrDefaultAsync(ct);

        return roleInt is null ? null : (OrgRole)roleInt.Value;
    }

    public async Task<int> CountOwnersAsync(Guid orgId, CancellationToken ct)
        => await _db.OrgMembers.AsNoTracking()
            .CountAsync(x =>
                x.OrganizationId == orgId &&
                !x.IsDeleted &&
                x.Role == (int)OrgRole.Owner, ct);

    public async Task UpdateRoleAsync(Guid orgId, Guid userId, OrgRole role, CancellationToken ct)
    {
        var entity = await _db.OrgMembers
            .FirstOrDefaultAsync(x =>
                x.OrganizationId == orgId &&
                x.UserId == userId &&
                !x.IsDeleted, ct);

        if (entity is null) return;

        entity.Role = (int)role;
        // UoW commits
    }

    public async Task RemoveAsync(Guid orgId, Guid userId, Guid deletedByUserId, CancellationToken ct)
    {
        var entity = await _db.OrgMembers
            .FirstOrDefaultAsync(x => x.OrganizationId == orgId && x.UserId == userId, ct);

        if (entity is null) return;
        if (entity.IsDeleted) return; // idempotent

        entity.IsDeleted = true;
        entity.DeletedAtUtc = DateTimeOffset.UtcNow;
        entity.DeletedByUserId = deletedByUserId;

        // UoW commits
    }
}
