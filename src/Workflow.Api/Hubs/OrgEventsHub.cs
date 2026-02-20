using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Workflow.Application.Organizations;
using Workflow.Api.Realtime;

namespace Workflow.Api.Hubs;

[Authorize]
public sealed class OrgEventsHub : Hub
{
    private readonly IOrgMemberRepository _members;
    private readonly ILogger<OrgEventsHub> _logger;

    public OrgEventsHub(IOrgMemberRepository members, ILogger<OrgEventsHub> logger)
    {
        _members = members;
        _logger = logger;
    }

    public override Task OnConnectedAsync()
    {
        RealtimeMetrics.ConnectionOpened();
        _logger.LogInformation("Realtime connected: connectionId={ConnectionId}", Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        RealtimeMetrics.ConnectionClosed();
        _logger.LogInformation("Realtime disconnected: connectionId={ConnectionId}", Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }

    public async Task JoinOrg(Guid orgId)
    {
        var userId = GetUserIdOrThrow(Context.User);
        var role = await _members.GetRoleAsync(orgId, userId, Context.ConnectionAborted);
        if (role is null)
        {
            RealtimeMetrics.JoinAttempt(success: false);
            _logger.LogWarning(
                "Realtime join denied: connectionId={ConnectionId}, orgId={OrgId}, userId={UserId}",
                Context.ConnectionId, orgId, userId);
            throw new HubException("Not a member of this organization.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, OrgGroupName(orgId));
        RealtimeMetrics.JoinAttempt(success: true);
        _logger.LogInformation(
            "Realtime join success: connectionId={ConnectionId}, orgId={OrgId}, userId={UserId}",
            Context.ConnectionId, orgId, userId);
    }

    public Task LeaveOrg(Guid orgId)
    {
        _logger.LogInformation(
            "Realtime leave: connectionId={ConnectionId}, orgId={OrgId}",
            Context.ConnectionId, orgId);
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, OrgGroupName(orgId));
    }

    public static string OrgGroupName(Guid orgId) => $"org:{orgId}";

    private static Guid GetUserIdOrThrow(ClaimsPrincipal? user)
    {
        var raw = user?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(raw, out var userId) || userId == Guid.Empty)
            throw new HubException("Missing or invalid user identity.");

        return userId;
    }
}
