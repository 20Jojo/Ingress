namespace Workflow.Api.Messaging.Contracts;

public sealed record OrgMemberRoleChanged(
    Guid OrganizationId,
    Guid UserId,
    string FromRole,
    string ToRole,
    Guid ChangedByUserId,
    DateTimeOffset ChangedAtUtc
);

