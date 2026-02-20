using System.Security.Claims;
using Workflow.Application.Users;

namespace Workflow.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/users").WithTags("Users");

        group.RequireAuthorization();

        // Scoped list: return only the authenticated caller's user record.
        group.MapGet("", async (HttpContext http, IUserRepository users, CancellationToken ct) =>
        {
            var rawUserId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(rawUserId, out var userId))
                return Results.Unauthorized();

            var user = await users.GetAsync(userId, ct);
            if (user is null)
                return Results.Unauthorized();

            return Results.Ok(new[]
            {
                new { user.Id, user.Email, user.DisplayName }
            });
        });

        group.MapGet("/{userId:guid}", async (Guid userId, IUserRepository users, CancellationToken ct) =>
        {
            var user = await users.GetAsync(userId, ct);
            return user is null
                ? Results.NotFound(new { message = "User not found." })
                : Results.Ok(new { user.Id, user.Email, user.DisplayName });
        });

        return app;
    }
}
