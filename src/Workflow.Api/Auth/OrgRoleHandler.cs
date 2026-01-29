using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Workflow.Application.Organizations;

namespace Workflow.Api.Auth;

public sealed class OrgRoleHandler : AuthorizationHandler<OrgRoleRequirement>
{
    private readonly IOrgMemberRepository _members;

    public OrgRoleHandler(IOrgMemberRepository members) => _members = members;

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, OrgRoleRequirement requirement)
    {
        if (context.Resource is not HttpContext http)
            return;

        var orgIdObj = http.Request.RouteValues.TryGetValue("orgId", out var v) ? v : null;
        if (orgIdObj is null) return;
        if (!Guid.TryParse(orgIdObj.ToString(), out var orgId) || orgId == Guid.Empty) return;

        var userIdRaw = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdRaw, out var userId) || userId == Guid.Empty) return;

        var role = await _members.GetRoleAsync(orgId, userId, http.RequestAborted);
        if (role is null) return;

        // Lower number = higher privilege (Owner=1, Admin=2, Member=3)
        if ((int)role.Value <= (int)requirement.MinimumRole)
            context.Succeed(requirement);
    }
}
