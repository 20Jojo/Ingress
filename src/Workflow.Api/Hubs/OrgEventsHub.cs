using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Workflow.Application.Organizations;

namespace Workflow.Api.Hubs;

[Authorize]
public sealed class OrgEventsHub : Hub
{
    private readonly IOrgMemberRepository _members;

    public OrgEventsHub(IOrgMemberRepository members)
    {
        _members = members;
    }

    public async Task JoinOrg(Guid orgId)
    {
        var userId = GetUserIdOrThrow(Context.User);
        var role = await _members.GetRoleAsync(orgId, userId, Context.ConnectionAborted);
        if (role is null)
            throw new HubException("Not a member of this organization.");

        await Groups.AddToGroupAsync(Context.ConnectionId, OrgGroupName(orgId));
    }

    public Task LeaveOrg(Guid orgId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, OrgGroupName(orgId));

    public static string OrgGroupName(Guid orgId) => $"org:{orgId}";

    private static Guid GetUserIdOrThrow(ClaimsPrincipal? user)
    {
        var raw = user?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(raw, out var userId) || userId == Guid.Empty)
            throw new HubException("Missing or invalid user identity.");

        return userId;
    }
}

