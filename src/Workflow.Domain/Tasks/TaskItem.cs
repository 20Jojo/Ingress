namespace Workflow.Domain.Tasks;

public sealed class TaskItem
{
    public Guid Id { get; }
    public Guid ProjectId { get; }
    public string Title { get; private set; }
    public string? Description { get; private set; }
    public TaskStatus Status { get; private set; }
    public Guid? AssigneeUserId { get; private set; }
    public DateTimeOffset? DueAt { get; private set; }

    public DateTimeOffset CreatedAt { get; }

    // Normal creation constructor (new tasks)
    public TaskItem(Guid id, Guid projectId, string title, string? description = null)
    {
        if (id == Guid.Empty) throw new ArgumentException("Task id cannot be empty.", nameof(id));
        if (projectId == Guid.Empty) throw new ArgumentException("Project id cannot be empty.", nameof(projectId));
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Task title is required.", nameof(title));

        Id = id;
        ProjectId = projectId;
        Title = title.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        Status = TaskStatus.Todo;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    // Rehydration constructor (loading from DB)
    // Kept internal so Domain stays clean. Infrastructure is allowed via InternalsVisibleTo.
    internal TaskItem(
        Guid id,
        Guid projectId,
        string title,
        string? description,
        TaskStatus status,
        Guid? assigneeUserId,
        DateTimeOffset? dueAt,
        DateTimeOffset createdAt)
    {
        if (id == Guid.Empty) throw new ArgumentException("Task id cannot be empty.", nameof(id));
        if (projectId == Guid.Empty) throw new ArgumentException("Project id cannot be empty.", nameof(projectId));
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Task title is required.", nameof(title));

        Id = id;
        ProjectId = projectId;
        Title = title.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        Status = status;
        AssigneeUserId = assigneeUserId;
        DueAt = dueAt;
        CreatedAt = createdAt;
    }

    public void UpdateDetails(string title, string? description)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Task title is required.", nameof(title));
        Title = title.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
    }

    public void SetStatus(TaskStatus status) => Status = status;

    public void AssignTo(Guid? userId)
    {
        if (userId == Guid.Empty) throw new ArgumentException("Assignee user id cannot be empty.", nameof(userId));
        AssigneeUserId = userId;
    }

    public void SetDueDate(DateTimeOffset? dueAt) => DueAt = dueAt;
}
