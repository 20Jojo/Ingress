using System.Security.Claims;

namespace Workflow.Api.Common;

public static class Caller
{
    public static bool TryGetUserId(HttpContext ctx, out Guid userId)
    {
        userId = default;
        var raw = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId) && userId != Guid.Empty;
    }
}
