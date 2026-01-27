using Microsoft.AspNetCore.Mvc;
using Workflow.Application.Common;
using Workflow.Application.Users;
using Workflow.Domain.Users;

namespace Workflow.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/users").WithTags("Users");

        group.MapPost("", async (
            [FromBody] CreateUserRequest req,
            IUserRepository users,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            var existing = await users.GetByEmailAsync(req.Email, ct);
            if (existing is not null)
                return Results.Conflict(new { message = "Email already exists." });

            var user = new User(Guid.NewGuid(), req.Email, req.DisplayName);
            await users.AddAsync(user, ct);
            await uow.SaveChangesAsync(ct);

            return Results.Created($"/users/{user.Id}", new
            {
                user.Id,
                user.Email,
                user.DisplayName
            });
        });

        group.MapGet("", async (IUserRepository users, CancellationToken ct) =>
        {
            var list = await users.ListAsync(ct);
            return Results.Ok(list.Select(u => new { u.Id, u.Email, u.DisplayName }));
        });

        group.MapGet("/{userId:guid}", async (Guid userId, IUserRepository users, CancellationToken ct) =>
        {
            var user = await users.GetAsync(userId, ct);
            return user is null
                ? Results.NotFound()
                : Results.Ok(new { user.Id, user.Email, user.DisplayName });
        });

        return app;
    }

    public sealed record CreateUserRequest(string Email, string DisplayName);
}
