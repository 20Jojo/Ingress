using FluentValidation;
using MassTransit;
using Workflow.Api.Common;
using Workflow.Api.Messaging.Contracts;
using Workflow.Application.Common;
using Workflow.Application.Organizations;
using Workflow.Application.Projects;
using Workflow.Application.Tasks;
using Workflow.Domain.Tasks;

namespace Workflow.Api.Endpoints;

using DomainTaskStatus = Workflow.Domain.Tasks.TaskStatus;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        // CREATE task (Member+)
        app.MapPost("/projects/{projectId:guid}/tasks", async (
            HttpContext ctx,
            Guid projectId,
            CreateTaskRequest req,
            IValidator<CreateTaskRequest> validator,
            IProjectRepository projectRepo,
            IOrgMemberRepository membersRepo,
            ITaskRepository taskRepo,
            IUnitOfWork uow,
            IPublishEndpoint publish,
            CancellationToken ct) =>
        {
            var problem = await ValidationExtensions.ValidateAndReturnProblemIfInvalid(req, validator, ct);
            if (problem is not null) return problem;

            var project = await projectRepo.GetAsync(projectId, ct);
            if (project is null)
                return Results.NotFound(new { message = "Project not found." });

            var auth = await OrgAuth.RequireMemberAsync(ctx, project.OrganizationId, membersRepo, ct);
            if (!auth.ok) return auth.problem!;

            var task = new TaskItem(Guid.NewGuid(), projectId, req.Title, req.Description);
            await taskRepo.AddAsync(task, ct);
            await uow.SaveChangesAsync(ct);
            await publish.Publish(new TaskChanged(
                task.Id,
                task.ProjectId,
                project.OrganizationId,
                "created",
                DateTimeOffset.UtcNow
            ), ct);

            return Results.Created($"/tasks/{task.Id}", TaskResponse.From(task));
        });

        // LIST tasks (Member+)
        app.MapGet("/projects/{projectId:guid}/tasks", async (
            HttpContext ctx,
            Guid projectId,
            IProjectRepository projectRepo,
            IOrgMemberRepository membersRepo,
            ITaskRepository taskRepo,
            CancellationToken ct) =>
        {
            var project = await projectRepo.GetAsync(projectId, ct);
            if (project is null)
                return Results.NotFound(new { message = "Project not found." });

            var auth = await OrgAuth.RequireMemberAsync(ctx, project.OrganizationId, membersRepo, ct);
            if (!auth.ok) return auth.problem!;

            var tasks = await taskRepo.ListByProjectAsync(projectId, ct);
            return Results.Ok(tasks.Select(TaskResponse.From));
        });

        // GET single task (Member+)
        app.MapGet("/tasks/{taskId:guid}", async (
            HttpContext ctx,
            Guid taskId,
            ITaskRepository taskRepo,
            IProjectRepository projectRepo,
            IOrgMemberRepository membersRepo,
            CancellationToken ct) =>
        {
            var task = await taskRepo.GetAsync(taskId, ct);
            if (task is null)
                return Results.NotFound(new { message = "Task not found." });

            var orgId = await projectRepo.GetOrganizationIdAsync(task.ProjectId, ct);
            if (orgId is null)
                return Results.BadRequest(new { message = "Project not found for this task." });

            var auth = await OrgAuth.RequireMemberAsync(ctx, orgId.Value, membersRepo, ct);
            if (!auth.ok) return auth.problem!;

            return Results.Ok(TaskResponse.From(task));
        });

        // UPDATE status (Member+)
        app.MapPatch("/tasks/{taskId:guid}/status", async (
            HttpContext ctx,
            Guid taskId,
            UpdateTaskStatusRequest req,
            ITaskRepository taskRepo,
            IProjectRepository projectRepo,
            IOrgMemberRepository membersRepo,
            IUnitOfWork uow,
            IPublishEndpoint publish,
            CancellationToken ct) =>
        {
            var existing = await taskRepo.GetAsync(taskId, ct);
            if (existing is null)
                return Results.NotFound(new { message = "Task not found." });

            var orgId = await projectRepo.GetOrganizationIdAsync(existing.ProjectId, ct);
            if (orgId is null)
                return Results.BadRequest(new { message = "Project not found for this task." });

            var auth = await OrgAuth.RequireMemberAsync(ctx, orgId.Value, membersRepo, ct);
            if (!auth.ok) return auth.problem!;

            if (!TryParseStatus(req.Status, out var parsed))
            {
                return Results.BadRequest(new
                {
                    message = "Invalid status value.",
                    allowed = Enum.GetNames<DomainTaskStatus>(),
                    examples = new object[]
                    {
                        new { status = "Todo" },
                        new { status = "InProgress" },
                        new { status = "Done" },
                        new { status = "1" }
                    }
                });
            }

            await taskRepo.UpdateStatusAsync(taskId, parsed, ct);
            await uow.SaveChangesAsync(ct);
            await publish.Publish(new TaskChanged(
                taskId,
                existing.ProjectId,
                orgId.Value,
                "statusChanged",
                DateTimeOffset.UtcNow
            ), ct);

            var updated = await taskRepo.GetAsync(taskId, ct);
            return updated is null
                ? Results.NotFound(new { message = "Task not found." })
                : Results.Ok(TaskResponse.From(updated));
        });

        // UPDATE details (Member+)
        app.MapPut("/tasks/{taskId:guid}/details", async (
            HttpContext ctx,
            Guid taskId,
            UpdateTaskDetailsRequest req,
            IValidator<UpdateTaskDetailsRequest> validator,
            ITaskRepository taskRepo,
            IProjectRepository projectRepo,
            IOrgMemberRepository membersRepo,
            IUnitOfWork uow,
            IPublishEndpoint publish,
            CancellationToken ct) =>
        {
            var problem = await ValidationExtensions.ValidateAndReturnProblemIfInvalid(req, validator, ct);
            if (problem is not null) return problem;

            var existing = await taskRepo.GetAsync(taskId, ct);
            if (existing is null)
                return Results.NotFound(new { message = "Task not found." });

            var orgId = await projectRepo.GetOrganizationIdAsync(existing.ProjectId, ct);
            if (orgId is null)
                return Results.BadRequest(new { message = "Project not found for this task." });

            var auth = await OrgAuth.RequireMemberAsync(ctx, orgId.Value, membersRepo, ct);
            if (!auth.ok) return auth.problem!;

            await taskRepo.UpdateDetailsAsync(taskId, req.Title, req.Description, ct);
            await uow.SaveChangesAsync(ct);
            await publish.Publish(new TaskChanged(
                taskId,
                existing.ProjectId,
                orgId.Value,
                "detailsChanged",
                DateTimeOffset.UtcNow
            ), ct);

            var updated = await taskRepo.GetAsync(taskId, ct);
            return updated is null
                ? Results.NotFound(new { message = "Task not found." })
                : Results.Ok(TaskResponse.From(updated));
        });

        // UPDATE due date (Member+)
        app.MapPatch("/tasks/{taskId:guid}/due", async (
            HttpContext ctx,
            Guid taskId,
            UpdateTaskDueDateRequest req,
            ITaskRepository taskRepo,
            IProjectRepository projectRepo,
            IOrgMemberRepository membersRepo,
            IUnitOfWork uow,
            IPublishEndpoint publish,
            CancellationToken ct) =>
        {
            var existing = await taskRepo.GetAsync(taskId, ct);
            if (existing is null)
                return Results.NotFound(new { message = "Task not found." });

            var orgId = await projectRepo.GetOrganizationIdAsync(existing.ProjectId, ct);
            if (orgId is null)
                return Results.BadRequest(new { message = "Project not found for this task." });

            var auth = await OrgAuth.RequireMemberAsync(ctx, orgId.Value, membersRepo, ct);
            if (!auth.ok) return auth.problem!;

            await taskRepo.UpdateDueDateAsync(taskId, req.DueAt, ct);
            await uow.SaveChangesAsync(ct);
            await publish.Publish(new TaskChanged(
                taskId,
                existing.ProjectId,
                orgId.Value,
                "dueChanged",
                DateTimeOffset.UtcNow
            ), ct);

            var updated = await taskRepo.GetAsync(taskId, ct);
            return updated is null
                ? Results.NotFound(new { message = "Task not found." })
                : Results.Ok(TaskResponse.From(updated));
        });

        // ASSIGN / UNASSIGN (Member+ + assignee must be member)
        app.MapPatch("/tasks/{taskId:guid}/assign", async (
            HttpContext ctx,
            Guid taskId,
            AssignTaskRequest req,
            ITaskRepository taskRepo,
            IProjectRepository projectRepo,
            IOrgMemberRepository membersRepo,
            IUnitOfWork uow,
            IPublishEndpoint publish,
            CancellationToken ct) =>
        {
            var task = await taskRepo.GetAsync(taskId, ct);
            if (task is null)
                return Results.NotFound(new { message = "Task not found." });

            var orgId = await projectRepo.GetOrganizationIdAsync(task.ProjectId, ct);
            if (orgId is null)
                return Results.BadRequest(new { message = "Project not found for this task." });

            var auth = await OrgAuth.RequireMemberAsync(ctx, orgId.Value, membersRepo, ct);
            if (!auth.ok) return auth.problem!;

            // Unassign
            if (req.UserId is null)
            {
                await taskRepo.UpdateAssigneeAsync(taskId, null, ct);
                await uow.SaveChangesAsync(ct);
                await publish.Publish(new TaskChanged(
                    taskId,
                    task.ProjectId,
                    orgId.Value,
                    "unassigned",
                    DateTimeOffset.UtcNow
                ), ct);

                var updated = await taskRepo.GetAsync(taskId, ct);
                return updated is null
                    ? Results.NotFound(new { message = "Task not found." })
                    : Results.Ok(TaskResponse.From(updated));
            }

            // Assignee must be member
            var isAssigneeMember = await membersRepo.ExistsAsync(orgId.Value, req.UserId.Value, ct);
            if (!isAssigneeMember)
                return Results.BadRequest(new { message = "Assignee is not a member of this organization." });

            await taskRepo.UpdateAssigneeAsync(taskId, req.UserId.Value, ct);
            await uow.SaveChangesAsync(ct);
            await publish.Publish(new TaskChanged(
                taskId,
                task.ProjectId,
                orgId.Value,
                "assigned",
                DateTimeOffset.UtcNow
            ), ct);

            var result = await taskRepo.GetAsync(taskId, ct);
            return result is null
                ? Results.NotFound(new { message = "Task not found." })
                : Results.Ok(TaskResponse.From(result));
        });

        return app;
    }

    private static bool TryParseStatus(string? input, out DomainTaskStatus status)
    {
        status = default;

        if (string.IsNullOrWhiteSpace(input))
            return false;

        var s = input.Trim();

        if (int.TryParse(s, out var n))
        {
            if (Enum.IsDefined(typeof(DomainTaskStatus), n))
            {
                status = (DomainTaskStatus)n;
                return true;
            }
            return false;
        }

        if (Enum.TryParse<DomainTaskStatus>(s, ignoreCase: true, out var parsed) &&
            Enum.IsDefined(typeof(DomainTaskStatus), parsed))
        {
            status = parsed;
            return true;
        }

        return false;
    }
}

public sealed record CreateTaskRequest(string Title, string? Description);
public sealed record UpdateTaskStatusRequest(string Status);
public sealed record UpdateTaskDetailsRequest(string Title, string? Description);
public sealed record UpdateTaskDueDateRequest(DateTimeOffset? DueAt);
public sealed record AssignTaskRequest(Guid? UserId);

public sealed record TaskResponse(
    Guid Id,
    Guid ProjectId,
    string Title,
    string? Description,
    DomainTaskStatus Status,
    Guid? AssigneeUserId,
    DateTimeOffset? DueAt,
    DateTimeOffset CreatedAt)
{
    public static TaskResponse From(TaskItem t) =>
        new(t.Id, t.ProjectId, t.Title, t.Description, t.Status, t.AssigneeUserId, t.DueAt, t.CreatedAt);
}
