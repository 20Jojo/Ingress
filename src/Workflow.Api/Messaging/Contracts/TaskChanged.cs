namespace Workflow.Api.Messaging.Contracts;

public sealed record TaskChanged(
    Guid TaskId,
    Guid ProjectId,
    Guid OrganizationId,
    string ChangeType,
    DateTimeOffset ChangedAtUtc
);

