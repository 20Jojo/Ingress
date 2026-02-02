using Microsoft.EntityFrameworkCore;
using Workflow.Application.Users;
using Workflow.Infrastructure.Persistence;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Repositories;

public sealed class EfRefreshTokenRepository : IRefreshTokenRepository
{
    private readonly WorkflowDbContext _db;
    public EfRefreshTokenRepository(WorkflowDbContext db) => _db = db;

    public async Task CreateAsync(Guid userId, string tokenHash, DateTimeOffset expiresAtUtc, CancellationToken ct)
    {
        var entity = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = tokenHash,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            ExpiresAtUtc = expiresAtUtc,
            RevokedAtUtc = null,
            ReplacedByTokenHash = null
        };

        _db.RefreshTokens.Add(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<(Guid userId, DateTimeOffset expiresAtUtc, bool isRevoked, string? replacedByHash)?> FindByHashAsync(string tokenHash, CancellationToken ct)
    {
        var row = await _db.RefreshTokens.AsNoTracking()
            .Where(x => x.TokenHash == tokenHash)
            .Select(x => new { x.UserId, x.ExpiresAtUtc, x.RevokedAtUtc, x.ReplacedByTokenHash })
            .FirstOrDefaultAsync(ct);

        if (row is null) return null;

        return (row.UserId, row.ExpiresAtUtc, row.RevokedAtUtc is not null, row.ReplacedByTokenHash);
    }

    public async Task RevokeAsync(string tokenHash, DateTimeOffset revokedAtUtc, string? replacedByHash, CancellationToken ct)
    {
        var entity = await _db.RefreshTokens
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash, ct);

        if (entity is null) return;

        // idempotent
        if (entity.RevokedAtUtc is not null) return;

        entity.RevokedAtUtc = revokedAtUtc;
        entity.ReplacedByTokenHash = replacedByHash;

        await _db.SaveChangesAsync(ct);
    }
}
