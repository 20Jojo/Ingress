using Microsoft.AspNetCore.SignalR;
using Workflow.Api.Hubs;

namespace Workflow.Api.Realtime;

public sealed class OrgRealtimeBroadcaster
{
    private readonly IHubContext<OrgEventsHub> _hub;
    private readonly ILogger<OrgRealtimeBroadcaster> _logger;

    public OrgRealtimeBroadcaster(
        IHubContext<OrgEventsHub> hub,
        ILogger<OrgRealtimeBroadcaster> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public async Task BroadcastAsync(
        string type,
        Guid orgId,
        object payload,
        DateTimeOffset? occurredAtUtc = null)
    {
        var ev = new OrgRealtimeEvent(
            Type: type,
            OrganizationId: orgId,
            Payload: payload,
            OccurredAtUtc: occurredAtUtc ?? DateTimeOffset.UtcNow);

        await _hub.Clients.Group(OrgEventsHub.OrgGroupName(orgId))
            .SendAsync("org_event", ev);

        _logger.LogDebug(
            "Realtime event broadcast: type={Type}, orgId={OrgId}",
            type, orgId);
    }
}

