namespace Workflow.Application.Users;

public interface IRefreshTokenRepository
{
    Task CreateAsync(Guid userId, string tokenHash, DateTimeOffset expiresAtUtc, CancellationToken ct);
    Task<(Guid userId, DateTimeOffset expiresAtUtc, bool isRevoked, string? replacedByHash)?> FindByHashAsync(string tokenHash, CancellationToken ct);
    Task RevokeAsync(string tokenHash, DateTimeOffset revokedAtUtc, string? replacedByHash, CancellationToken ct);
}
