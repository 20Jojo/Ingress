namespace Workflow.Infrastructure.Persistence.Entities;

public enum TaskStatusEntity
{
    Todo = 0,
    InProgress = 1,
    Done = 2
}

public sealed class TaskEntity
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public TaskStatusEntity Status { get; set; } = TaskStatusEntity.Todo;

    public Guid? AssigneeUserId { get; set; }
    public DateTimeOffset? DueAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ProjectEntity? Project { get; set; }
}
