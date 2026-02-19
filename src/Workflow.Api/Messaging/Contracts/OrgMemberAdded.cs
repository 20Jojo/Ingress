namespace Workflow.Api.Messaging.Contracts;

public sealed record OrgMemberAdded(
    Guid OrganizationId,
    Guid UserId,
    string Role,
    Guid? AddedByUserId,
    DateTimeOffset AddedAtUtc
);

