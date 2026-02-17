using Hangfire.Dashboard;

namespace Workflow.Api.Jobs;

public sealed class HangfireAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var http = context.GetHttpContext();

        // Simple: any authenticated user can view dashboard.
        return http.User?.Identity?.IsAuthenticated == true;
    }
}
