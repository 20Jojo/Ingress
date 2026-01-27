using Microsoft.EntityFrameworkCore;
using Workflow.Application.Tasks;
using Workflow.Domain.Tasks;
using Workflow.Infrastructure.Persistence;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Repositories;

using DomainTaskStatus = Workflow.Domain.Tasks.TaskStatus;

public sealed class EfTaskRepository : ITaskRepository
{
    private readonly WorkflowDbContext _db;

    public EfTaskRepository(WorkflowDbContext db) => _db = db;

    public Task AddAsync(TaskItem task, CancellationToken ct)
    {
        var entity = new TaskEntity
        {
            Id = task.Id,
            ProjectId = task.ProjectId,
            Title = task.Title,
            Description = task.Description,
            Status = MapStatus(task.Status),
            AssigneeUserId = task.AssigneeUserId,

            // IMPORTANT: force UTC for timestamptz
            DueAt = ToUtc(task.DueAt),
            CreatedAt = ToUtc(task.CreatedAt)
        };

        _db.Tasks.Add(entity);
        return Task.CompletedTask; // SaveChanges via UnitOfWork
    }

    public async Task<TaskItem?> GetAsync(Guid id, CancellationToken ct)
    {
        var entity = await _db.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        return entity is null ? null : MapToDomain(entity);
    }

    public async Task<IReadOnlyList<TaskItem>> ListByProjectAsync(Guid projectId, CancellationToken ct)
    {
        var entities = await _db.Tasks
            .AsNoTracking()
            .Where(x => x.ProjectId == projectId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        return entities.Select(MapToDomain).ToList();
    }

    public async Task UpdateStatusAsync(Guid taskId, DomainTaskStatus status, CancellationToken ct)
    {
        var entity = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == taskId, ct);
        if (entity is null) return;

        entity.Status = MapStatus(status);
    }

    public async Task UpdateAssigneeAsync(Guid taskId, Guid? assigneeUserId, CancellationToken ct)
    {
        var entity = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == taskId, ct);
        if (entity is null) return;

        entity.AssigneeUserId = assigneeUserId;
    }

    public async Task UpdateDetailsAsync(Guid taskId, string title, string? description, CancellationToken ct)
    {
        var entity = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == taskId, ct);
        if (entity is null) return;

        entity.Title = title.Trim();
        entity.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
    }

    public async Task UpdateDueDateAsync(Guid taskId, DateTimeOffset? dueAt, CancellationToken ct)
    {
        var entity = await _db.Tasks.FirstOrDefaultAsync(x => x.Id == taskId, ct);
        if (entity is null) return;

        // IMPORTANT: force UTC for timestamptz
        entity.DueAt = ToUtc(dueAt);
    }

    private static DateTimeOffset? ToUtc(DateTimeOffset? dto)
        => dto is null ? null : dto.Value.ToUniversalTime();

    private static DateTimeOffset ToUtc(DateTimeOffset dto)
        => dto.ToUniversalTime();

    private static TaskItem MapToDomain(TaskEntity e)
    {
        var status = e.Status switch
        {
            TaskStatusEntity.Todo => DomainTaskStatus.Todo,
            TaskStatusEntity.InProgress => DomainTaskStatus.InProgress,
            TaskStatusEntity.Done => DomainTaskStatus.Done,
            _ => DomainTaskStatus.Todo
        };

        return new TaskItem(
            e.Id,
            e.ProjectId,
            e.Title,
            e.Description,
            status,
            e.AssigneeUserId,
            e.DueAt,
            e.CreatedAt);
    }

    private static TaskStatusEntity MapStatus(DomainTaskStatus status) => status switch
    {
        DomainTaskStatus.Todo => TaskStatusEntity.Todo,
        DomainTaskStatus.InProgress => TaskStatusEntity.InProgress,
        DomainTaskStatus.Done => TaskStatusEntity.Done,
        _ => TaskStatusEntity.Todo
    };
}
