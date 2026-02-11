namespace Workflow.Api.Common;

public static class CacheKeys
{
    // Keep keys predictable + grouped
    public static string OrgMembers(Guid orgId) => $"workflow:org:{orgId}:members";
}
