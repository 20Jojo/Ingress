namespace Workflow.Api.Realtime;

public sealed record OrgRealtimeEvent(
    string Type,
    Guid OrganizationId,
    object Payload,
    DateTimeOffset OccurredAtUtc
);

