using Microsoft.AspNetCore.Authorization;
using Workflow.Domain.Organizations;

namespace Workflow.Api.Auth;

public sealed class OrgRoleRequirement : IAuthorizationRequirement
{
    public OrgRoleRequirement(OrgRole minimumRole, string orgIdRouteParam = "orgId")
    {
        MinimumRole = minimumRole;
        OrgIdRouteParam = orgIdRouteParam;
    }

    public OrgRole MinimumRole { get; }
    public string OrgIdRouteParam { get; }
}
