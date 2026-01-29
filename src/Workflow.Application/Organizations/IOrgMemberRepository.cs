using Workflow.Domain.Organizations;

namespace Workflow.Application.Organizations;

public interface IOrgMemberRepository
{
    Task AddAsync(OrgMember member, CancellationToken ct);
    Task<bool> ExistsAsync(Guid orgId, Guid userId, CancellationToken ct);
    Task<IReadOnlyList<OrgMember>> ListByOrgAsync(Guid orgId, CancellationToken ct);

    Task<OrgRole?> GetRoleAsync(Guid orgId, Guid userId, CancellationToken ct);

    Task<int> CountOwnersAsync(Guid orgId, CancellationToken ct);
    Task UpdateRoleAsync(Guid orgId, Guid userId, OrgRole role, CancellationToken ct);

    // Soft delete
    Task RemoveAsync(Guid orgId, Guid userId, Guid actorUserId, CancellationToken ct);
}
