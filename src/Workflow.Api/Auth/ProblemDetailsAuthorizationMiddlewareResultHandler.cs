using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

namespace Workflow.Api.Auth;

public sealed class ProblemDetailsAuthorizationMiddlewareResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        // If authorized, continue
        if (authorizeResult.Succeeded)
        {
            await next(context);
            return;
        }

        // If not authenticated -> 401 with message
        if (authorizeResult.Challenged)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/problem+json";

            await context.Response.WriteAsJsonAsync(new
            {
                title = "Unauthorized",
                status = 401,
                detail = "Missing or invalid X-User-Id header."
            });

            return;
        }

        // Forbidden -> 403 with the failure reason from our handler
        if (authorizeResult.Forbidden)
        {
            var reason =
                authorizeResult.AuthorizationFailure?.FailureReasons?.FirstOrDefault()?.Message
                ?? "Forbidden.";

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/problem+json";

            await context.Response.WriteAsJsonAsync(new
            {
                title = "Forbidden",
                status = 403,
                detail = reason
            });

            return;
        }

        // Fallback to default behavior if something unexpected happens
        await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}
