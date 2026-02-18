using MassTransit;
using Workflow.Api.Messaging.Contracts;

namespace Workflow.Api.Messaging.Consumers;

public sealed class OrgInvitationDeletedConsumer : IConsumer<OrgInvitationDeleted>
{
    private readonly ILogger<OrgInvitationDeletedConsumer> _logger;

    public OrgInvitationDeletedConsumer(ILogger<OrgInvitationDeletedConsumer> logger)
        => _logger = logger;

    public Task Consume(ConsumeContext<OrgInvitationDeleted> context)
    {
        var m = context.Message;

        _logger.LogInformation(
            "OrgInvitationDeleted received: invitationId={InvitationId}, orgId={OrgId}, email={Email}, role={Role}, deletedBy={DeletedBy}, deletedAt={DeletedAt}",
            m.InvitationId, m.OrganizationId, m.Email, m.Role, m.DeletedByUserId, m.DeletedAtUtc);

        return Task.CompletedTask;
    }
}
