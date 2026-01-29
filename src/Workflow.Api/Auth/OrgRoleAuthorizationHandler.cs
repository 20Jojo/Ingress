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
        if (context.Resource is not HttpContext http)
        {
            context.Fail(new AuthorizationFailureReason(this, "Authorization context missing HttpContext."));
            return;
        }

        // Caller id from auth scheme (ClaimTypes.NameIdentifier)
        var rawUserId = http.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(rawUserId) || !Guid.TryParse(rawUserId, out var userId) || userId == Guid.Empty)
        {
            context.Fail(new AuthorizationFailureReason(this, "Missing or invalid X-User-Id header."));
            return;
        }

        // orgId from route
        if (!http.Request.RouteValues.TryGetValue(requirement.OrgIdRouteParam, out var rawOrgId) ||
            rawOrgId is null ||
            !Guid.TryParse(rawOrgId.ToString(), out var orgId) ||
            orgId == Guid.Empty)
        {
            context.Fail(new AuthorizationFailureReason(this, "Missing or invalid orgId in route."));
            return;
        }

        var role = await _members.GetRoleAsync(orgId, userId, http.RequestAborted);
        if (role is null)
        {
            context.Fail(new AuthorizationFailureReason(this, "You are not a member of this organization (or you were removed)."));
            return;
        }

        // Lower number = higher privilege
        if ((int)role.Value > (int)requirement.MinimumRole)
        {
            var msg = requirement.MinimumRole switch
            {
                OrgRole.Owner => "Only an Owner can perform this action.",
                OrgRole.Admin => "Only an Admin or Owner can perform this action.",
                _ => "You do not have permission to perform this action."
            };

            context.Fail(new AuthorizationFailureReason(this, msg));
            return;
        }

        context.Succeed(requirement);
    }
}
