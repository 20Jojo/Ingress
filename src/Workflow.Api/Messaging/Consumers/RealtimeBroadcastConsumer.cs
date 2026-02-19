using MassTransit;
using Workflow.Api.Messaging.Contracts;
using Workflow.Api.Realtime;

namespace Workflow.Api.Messaging.Consumers;

public sealed class RealtimeBroadcastConsumer :
    IConsumer<OrgInvitationCreated>,
    IConsumer<OrgInvitationDeleted>,
    IConsumer<OrgInvitationAccepted>,
    IConsumer<OrgMemberAdded>,
    IConsumer<OrgMemberRoleChanged>,
    IConsumer<OrgMemberRemoved>,
    IConsumer<ProjectCreated>,
    IConsumer<TaskChanged>
{
    private readonly OrgRealtimeBroadcaster _broadcaster;

    public RealtimeBroadcastConsumer(OrgRealtimeBroadcaster broadcaster)
    {
        _broadcaster = broadcaster;
    }

    public Task Consume(ConsumeContext<OrgInvitationCreated> context)
        => _broadcaster.BroadcastAsync(
            "invite.created",
            context.Message.OrganizationId,
            context.Message,
            context.Message.CreatedAtUtc);

    public Task Consume(ConsumeContext<OrgInvitationDeleted> context)
        => _broadcaster.BroadcastAsync(
            "invite.revoked",
            context.Message.OrganizationId,
            context.Message,
            context.Message.DeletedAtUtc);

    public Task Consume(ConsumeContext<OrgInvitationAccepted> context)
        => _broadcaster.BroadcastAsync(
            "invite.accepted",
            context.Message.OrganizationId,
            context.Message,
            context.Message.AcceptedAtUtc);

    public Task Consume(ConsumeContext<OrgMemberAdded> context)
        => _broadcaster.BroadcastAsync(
            "member.added",
            context.Message.OrganizationId,
            context.Message,
            context.Message.AddedAtUtc);

    public Task Consume(ConsumeContext<OrgMemberRoleChanged> context)
        => _broadcaster.BroadcastAsync(
            "member.roleChanged",
            context.Message.OrganizationId,
            context.Message,
            context.Message.ChangedAtUtc);

    public Task Consume(ConsumeContext<OrgMemberRemoved> context)
        => _broadcaster.BroadcastAsync(
            "member.removed",
            context.Message.OrganizationId,
            context.Message,
            context.Message.RemovedAtUtc);

    public Task Consume(ConsumeContext<ProjectCreated> context)
        => _broadcaster.BroadcastAsync(
            "project.created",
            context.Message.OrganizationId,
            context.Message,
            context.Message.CreatedAtUtc);

    public Task Consume(ConsumeContext<TaskChanged> context)
        => _broadcaster.BroadcastAsync(
            $"task.{context.Message.ChangeType}",
            context.Message.OrganizationId,
            context.Message,
            context.Message.ChangedAtUtc);
}

