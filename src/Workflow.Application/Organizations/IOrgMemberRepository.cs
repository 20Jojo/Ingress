using Workflow.Domain.Organizations;

namespace Workflow.Application.Organizations;

public interface IOrgMemberRepository
{
    Task AddAsync(OrgMember member, CancellationToken ct);
    Task<bool> ExistsAsync(Guid orgId, Guid userId, CancellationToken ct);
    Task<IReadOnlyList<OrgMember>> ListByOrgAsync(Guid orgId, CancellationToken ct);

    // Needed by OrgAuth
    Task<OrgRole?> GetRoleAsync(Guid orgId, Guid userId, CancellationToken ct);
}
