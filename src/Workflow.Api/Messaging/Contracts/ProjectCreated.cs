namespace Workflow.Api.Messaging.Contracts;

public sealed record ProjectCreated(
    Guid ProjectId,
    Guid OrganizationId,
    string Name,
    DateTimeOffset CreatedAtUtc
);

