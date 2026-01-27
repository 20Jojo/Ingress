using Workflow.Domain.Tasks;

namespace Workflow.Application.Tasks;

using DomainTaskStatus = Workflow.Domain.Tasks.TaskStatus;

public interface ITaskRepository
{
    Task AddAsync(TaskItem task, CancellationToken ct);
    Task<TaskItem?> GetAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<TaskItem>> ListByProjectAsync(Guid projectId, CancellationToken ct);

    Task UpdateStatusAsync(Guid taskId, DomainTaskStatus status, CancellationToken ct);
    Task UpdateAssigneeAsync(Guid taskId, Guid? assigneeUserId, CancellationToken ct);

    // NEW: details + due date
    Task UpdateDetailsAsync(Guid taskId, string title, string? description, CancellationToken ct);
    Task UpdateDueDateAsync(Guid taskId, DateTimeOffset? dueAt, CancellationToken ct);
}
