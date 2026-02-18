using MassTransit;
using Workflow.Api.Messaging.Contracts;

namespace Workflow.Api.Messaging.Consumers;

public sealed class OrgInvitationCreatedConsumer : IConsumer<OrgInvitationCreated>
{
    private readonly ILogger<OrgInvitationCreatedConsumer> _logger;

    public OrgInvitationCreatedConsumer(ILogger<OrgInvitationCreatedConsumer> logger)
        => _logger = logger;

    public Task Consume(ConsumeContext<OrgInvitationCreated> context)
    {
        var m = context.Message;

        _logger.LogInformation(
            "OrgInvitationCreated received: invitationId={InvitationId}, orgId={OrgId}, email={Email}, role={Role}, expiresAt={ExpiresAt}",
            m.InvitationId, m.OrganizationId, m.Email, m.Role, m.ExpiresAtUtc);

        return Task.CompletedTask;
    }
}
