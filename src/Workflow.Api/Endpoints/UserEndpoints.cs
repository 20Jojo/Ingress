using Workflow.Application.Users;

namespace Workflow.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/users").WithTags("Users");

        // If you want these locked to any authenticated user:
        group.RequireAuthorization();

        // If you want ONLY admins/owners later, we can add a policy.
        // group.RequireAuthorization("OrgAdmin");

        group.MapGet("", async (IUserRepository users, CancellationToken ct) =>
        {
            var list = await users.ListAsync(ct);
            return Results.Ok(list.Select(u => new { u.Id, u.Email, u.DisplayName }));
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
