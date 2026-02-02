using Microsoft.EntityFrameworkCore;
using Workflow.Application.Users;
using Workflow.Domain.Users;
using Workflow.Infrastructure.Persistence;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Repositories;

public sealed class EfUserRepository : IUserRepository
{
    private readonly WorkflowDbContext _db;

    public EfUserRepository(WorkflowDbContext db) => _db = db;

    public async Task AddAsync(User user, CancellationToken ct)
    {
        var entity = new UserEntity
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            PasswordHash = user.PasswordHash
        };

        _db.Users.Add(entity);

        // NOTE: if you are using UnitOfWork, prefer not saving here.
        // Keep this ONLY if the rest of your repos also save here.
        // Ideally remove this line and rely on uow.SaveChangesAsync.
        await _db.SaveChangesAsync(ct);
    }

    public async Task<User?> GetAsync(Guid id, CancellationToken ct)
    {
        var entity = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        return entity is null
            ? null
            : new User(entity.Id, entity.Email, entity.DisplayName, entity.PasswordHash);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct)
    {
        var normalized = email.Trim().ToLowerInvariant();

        var entity = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Email.ToLower() == normalized, ct);

        return entity is null
            ? null
            : new User(entity.Id, entity.Email, entity.DisplayName, entity.PasswordHash);
    }

    public async Task<IReadOnlyList<User>> ListAsync(CancellationToken ct)
    {
        var entities = await _db.Users
            .AsNoTracking()
            .OrderBy(x => x.Email)
            .ToListAsync(ct);

        return entities
            .Select(x => new User(x.Id, x.Email, x.DisplayName, x.PasswordHash))
            .ToList();
    }
}
