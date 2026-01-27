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

    public async Task AddAsync(OrgMember member, CancellationToken ct)
    {
        var entity = new OrgMemberEntity
        {
            OrganizationId = member.OrganizationId,
            UserId = member.UserId,
            Role = (int)member.Role,
            JoinedAt = member.JoinedAt
        };

        _db.OrgMembers.Add(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> ExistsAsync(Guid orgId, Guid userId, CancellationToken ct)
        => await _db.OrgMembers.AsNoTracking()
            .AnyAsync(x => x.OrganizationId == orgId && x.UserId == userId, ct);

    public async Task<IReadOnlyList<OrgMember>> ListByOrgAsync(Guid orgId, CancellationToken ct)
    {
        var list = await _db.OrgMembers.AsNoTracking()
            .Where(x => x.OrganizationId == orgId)
            .OrderBy(x => x.JoinedAt)
            .ToListAsync(ct);

        return list
            .Select(x => new OrgMember(x.OrganizationId, x.UserId, (OrgRole)x.Role, x.JoinedAt))
            .ToList();
    }

    public async Task<OrgRole?> GetRoleAsync(Guid orgId, Guid userId, CancellationToken ct)
    {
        var roleInt = await _db.OrgMembers.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && x.UserId == userId)
            .Select(x => (int?)x.Role)
            .FirstOrDefaultAsync(ct);

        return roleInt is null ? null : (OrgRole)roleInt.Value;
    }
}
