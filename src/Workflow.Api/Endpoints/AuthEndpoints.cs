using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Workflow.Api.Auth;
using Workflow.Application.Common;
using Workflow.Application.Users;
using Workflow.Domain.Users;

namespace Workflow.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth").WithTags("Auth");

        // POST /auth/register
        group.MapPost("/register", async (
            [FromBody] RegisterRequest req,
            IUserRepository users,
            PasswordHasher hasher,
            IUnitOfWork uow,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email) ||
                string.IsNullOrWhiteSpace(req.DisplayName) ||
                string.IsNullOrWhiteSpace(req.Password))
            {
                return Results.BadRequest(new { message = "Email, DisplayName, and Password are required." });
            }

            var email = req.Email.Trim().ToLowerInvariant();

            var existing = await users.GetByEmailAsync(email, ct);
            if (existing is not null)
                return Results.Conflict(new { message = "Email already exists." });

            var hash = hasher.Hash(req.Password);

            var user = new User(Guid.NewGuid(), email, req.DisplayName.Trim(), hash);
            await users.AddAsync(user, ct);
            await uow.SaveChangesAsync(ct);

            return Results.Created($"/users/{user.Id}", new { user.Id, user.Email, user.DisplayName });
        })
        .AllowAnonymous();

        // POST /auth/login
        group.MapPost("/login", async (
            [FromBody] LoginRequest req,
            IUserRepository users,
            PasswordHasher hasher,
            JwtTokenService tokens,
            RefreshTokenService refresh,
            IRefreshTokenRepository refreshRepo,
            IOptions<JwtOptions> jwtOpts,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return Results.BadRequest(new { message = "Email and Password are required." });

            var email = req.Email.Trim().ToLowerInvariant();

            var user = await users.GetByEmailAsync(email, ct);
            if (user is null)
                return Results.Unauthorized();

            if (!hasher.Verify(req.Password, user.PasswordHash))
                return Results.Unauthorized();

            var accessToken = tokens.CreateAccessToken(user.Id);

            var (rawRefresh, hash) = refresh.Generate();
            var expiresAt = DateTimeOffset.UtcNow.AddDays(jwtOpts.Value.RefreshTokenDays);

            await refreshRepo.CreateAsync(user.Id, hash, expiresAt, ct);

            return Results.Ok(new
            {
                accessToken,
                refreshToken = rawRefresh,
                tokenType = "Bearer"
            });
        })
        .AllowAnonymous();

        // POST /auth/refresh
        group.MapPost("/refresh", async (
            [FromBody] RefreshRequest req,
            JwtTokenService tokens,
            RefreshTokenService refresh,
            IRefreshTokenRepository refreshRepo,
            IOptions<JwtOptions> jwtOpts,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.RefreshToken))
                return Results.BadRequest(new { message = "RefreshToken is required." });

            var oldHash = refresh.Hash(req.RefreshToken.Trim());

            var found = await refreshRepo.FindByHashAsync(oldHash, ct);
            if (found is null)
                return Results.Unauthorized();

            var (userId, expiresAtUtc, isRevoked, _) = found.Value;

            if (isRevoked) return Results.Unauthorized();
            if (expiresAtUtc <= DateTimeOffset.UtcNow) return Results.Unauthorized();

            // rotate refresh token
            var (newRaw, newHash) = refresh.Generate();
            var newExpiresAt = DateTimeOffset.UtcNow.AddDays(jwtOpts.Value.RefreshTokenDays);

            await refreshRepo.CreateAsync(userId, newHash, newExpiresAt, ct);
            await refreshRepo.RevokeAsync(oldHash, DateTimeOffset.UtcNow, replacedByHash: newHash, ct);

            var accessToken = tokens.CreateAccessToken(userId);

            return Results.Ok(new
            {
                accessToken,
                refreshToken = newRaw,
                tokenType = "Bearer"
            });
        })
        .AllowAnonymous();

        // POST /auth/logout
        group.MapPost("/logout", async (
            [FromBody] RefreshRequest req,
            RefreshTokenService refresh,
            IRefreshTokenRepository refreshRepo,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.RefreshToken))
                return Results.BadRequest(new { message = "RefreshToken is required." });

            var hash = refresh.Hash(req.RefreshToken.Trim());
            await refreshRepo.RevokeAsync(hash, DateTimeOffset.UtcNow, replacedByHash: null, ct);

            return Results.NoContent();
        })
        .AllowAnonymous();

        return app;
    }

    public sealed record RegisterRequest(string Email, string DisplayName, string Password);
    public sealed record LoginRequest(string Email, string Password);
    public sealed record RefreshRequest(string RefreshToken);
}
