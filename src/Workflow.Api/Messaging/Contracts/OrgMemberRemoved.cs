namespace Workflow.Api.Messaging.Contracts;

public sealed record OrgMemberRemoved(
    Guid OrganizationId,
    Guid UserId,
    string PreviousRole,
    Guid RemovedByUserId,
    DateTimeOffset RemovedAtUtc
);

