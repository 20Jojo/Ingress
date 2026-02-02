using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Workflow.Application.Organizations;
using Workflow.Domain.Organizations;

namespace Workflow.Api.Auth;

public sealed class OrgRoleAuthorizationHandler : AuthorizationHandler<OrgRoleRequirement>
{
    private readonly IOrgMemberRepository _members;

    public OrgRoleAuthorizationHandler(IOrgMemberRepository members)
        => _members = members;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        OrgRoleRequirement requirement)
    {
        // Minimal APIs: Resource is usually HttpContext
        if (context.Resource is not HttpContext http)
            return;

        // 1) Caller userId from JWT claims (NO HEADERS)
        var rawUserId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(rawUserId) || !Guid.TryParse(rawUserId, out var userId) || userId == Guid.Empty)
            return;

        // 2) orgId from route
        if (!http.Request.RouteValues.TryGetValue(requirement.OrgIdRouteParam, out var rawOrgId) ||
            rawOrgId is null ||
            !Guid.TryParse(rawOrgId.ToString(), out var orgId) ||
            orgId == Guid.Empty)
        {
            return;
        }

        // 3) Must be member and have sufficient role (ignore soft-deleted members via repo filters)
        var role = await _members.GetRoleAsync(orgId, userId, http.RequestAborted);
        if (role is null)
            return;

        // Owner(1) > Admin(2) > Member(3)
        if ((int)role.Value <= (int)requirement.MinimumRole)
            context.Succeed(requirement);
    }
}
