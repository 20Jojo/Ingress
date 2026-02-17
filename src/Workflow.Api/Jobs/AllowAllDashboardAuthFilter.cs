using Hangfire.Dashboard;

namespace Workflow.Api.Jobs;

public sealed class AllowAllDashboardAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context) => true;
}
