using Workflow.Domain.Organizations;

namespace Workflow.Application.Organizations;

public interface IOrganizationRepository
{
    Task AddAsync(Organization organization, CancellationToken ct);
    Task<Organization?> GetAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Organization>> ListAsync(CancellationToken ct);
    Task<IReadOnlyList<Organization>> ListByUserAsync(Guid userId, CancellationToken ct);
}
