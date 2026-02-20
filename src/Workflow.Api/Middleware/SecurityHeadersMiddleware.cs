namespace Workflow.Api.Middleware;

public sealed class SecurityHeadersMiddleware : IMiddleware
{
    private readonly IWebHostEnvironment _env;

    public SecurityHeadersMiddleware(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var headers = context.Response.Headers;

        headers.TryAdd("X-Content-Type-Options", "nosniff");
        headers.TryAdd("X-Frame-Options", "DENY");
        headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");
        headers.TryAdd("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        headers.TryAdd("Cross-Origin-Opener-Policy", "same-origin");

        if (!_env.IsDevelopment())
        {
            headers.TryAdd("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        }

        await next(context);
    }
}
