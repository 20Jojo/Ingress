namespace Workflow.Api.Messaging.Contracts;

public sealed record OrgInvitationDeleted(
    Guid InvitationId,
    Guid OrganizationId,
    string Email,
    string Role,
    Guid DeletedByUserId,
    DateTimeOffset DeletedAtUtc
);
