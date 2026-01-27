using Workflow.Domain.Projects;

namespace Workflow.Application.Projects;

public interface IProjectRepository
{
    Task AddAsync(Project project, CancellationToken ct);
    Task<Project?> GetAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Project>> ListByOrganizationAsync(Guid orgId, CancellationToken ct);

    // Needed for Task -> Project -> Org membership checks
    Task<Guid?> GetOrganizationIdAsync(Guid projectId, CancellationToken ct);
}
