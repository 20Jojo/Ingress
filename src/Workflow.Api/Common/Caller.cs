namespace Workflow.Api.Common;

public static class Caller
{
    public static bool TryGetUserId(HttpContext ctx, out Guid userId)
    {
        userId = default;

        if (!ctx.Request.Headers.TryGetValue("X-User-Id", out var raw))
            return false;

        return Guid.TryParse(raw.ToString(), out userId) && userId != Guid.Empty;
    }
}
