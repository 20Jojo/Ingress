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

    public Task AddAsync(User user, CancellationToken ct)
    {
        var entity = new UserEntity
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName
        };

        _db.Users.Add(entity);
        return Task.CompletedTask; // SaveChanges via UnitOfWork
    }

    public async Task<User?> GetAsync(Guid id, CancellationToken ct)
    {
        var e = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return e is null ? null : new User(e.Id, e.Email, e.DisplayName);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct)
    {
        var norm = email.Trim().ToLowerInvariant();
        var e = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Email == norm, ct);
        return e is null ? null : new User(e.Id, e.Email, e.DisplayName);
    }

    public async Task<IReadOnlyList<User>> ListAsync(CancellationToken ct)
    {
        var list = await _db.Users.AsNoTracking().OrderBy(x => x.DisplayName).ToListAsync(ct);
        return list.Select(x => new User(x.Id, x.Email, x.DisplayName)).ToList();
    }
}
