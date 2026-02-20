using System.Diagnostics.Metrics;

namespace Workflow.Api.Realtime;

public static class RealtimeMetrics
{
    private static readonly Meter Meter = new("Workflow.Api.Realtime", "1.0.0");

    private static readonly UpDownCounter<long> ActiveConnections =
        Meter.CreateUpDownCounter<long>("realtime_connections_active");

    private static readonly Counter<long> ConnectionEvents =
        Meter.CreateCounter<long>("realtime_connection_events_total");

    private static readonly Counter<long> JoinEvents =
        Meter.CreateCounter<long>("realtime_join_events_total");

    private static readonly Counter<long> BroadcastEvents =
        Meter.CreateCounter<long>("realtime_broadcast_events_total");

    public static void ConnectionOpened()
    {
        ActiveConnections.Add(1);
        ConnectionEvents.Add(1, new KeyValuePair<string, object?>("event", "connected"));
    }

    public static void ConnectionClosed()
    {
        ActiveConnections.Add(-1);
        ConnectionEvents.Add(1, new KeyValuePair<string, object?>("event", "disconnected"));
    }

    public static void JoinAttempt(bool success)
    {
        JoinEvents.Add(
            1,
            new KeyValuePair<string, object?>("result", success ? "success" : "denied"));
    }

    public static void Broadcast(string type)
    {
        BroadcastEvents.Add(1, new KeyValuePair<string, object?>("type", type));
    }
}
