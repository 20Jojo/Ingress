namespace Workflow.Api.Messaging.Contracts;

public sealed record OrgInvitationAccepted(
    Guid InvitationId,
    Guid OrganizationId,
    Guid UserId,
    string Role,
    DateTimeOffset AcceptedAtUtc
);

