using System.Security.Claims;
using Workflow.Application.Organizations;
using Workflow.Domain.Organizations;

namespace Workflow.Api.Common;

public static class OrgAuth
{
    public static bool TryGetCallerId(HttpContext ctx, out Guid userId)
    {
        userId = default;
        var raw = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId) && userId != Guid.Empty;
    }

    public static IResult UnauthorizedMissingCaller()
        => Results.Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Unauthorized", detail: "Missing or invalid Bearer token.");

    public static IResult Forbidden(string detail)
        => Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: "Forbidden", detail: detail);

    public static async Task<(bool ok, OrgRole? role, IResult? problem)> RequireOrgRoleAsync(
        HttpContext ctx,
        Guid orgId,
        IOrgMemberRepository members,
        OrgRole minimumRole,
        CancellationToken ct)
    {
        if (!TryGetCallerId(ctx, out var callerId))
            return (false, null, UnauthorizedMissingCaller());

        var role = await members.GetRoleAsync(orgId, callerId, ct);
        if (role is null)
            return (false, null, Forbidden("Caller is not a member of this organization."));

        // Owner(1) > Admin(2) > Member(3)  (lower number = higher privilege)
        if ((int)role.Value > (int)minimumRole)
            return (false, role, Forbidden($"Insufficient role. Required {minimumRole} or higher."));

        return (true, role, null);
    }

    public static async Task<(bool ok, OrgRole? role, IResult? problem)> RequireMemberAsync(
        HttpContext ctx,
        Guid orgId,
        IOrgMemberRepository members,
        CancellationToken ct)
        => await RequireOrgRoleAsync(ctx, orgId, members, OrgRole.Member, ct);
}
