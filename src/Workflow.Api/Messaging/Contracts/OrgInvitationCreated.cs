namespace Workflow.Api.Messaging.Contracts;

public sealed record OrgInvitationCreated(
    Guid InvitationId,
    Guid OrganizationId,
    string Email,
    string Role,
    DateTimeOffset ExpiresAtUtc,
    DateTimeOffset CreatedAtUtc
);
