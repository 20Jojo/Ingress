using Workflow.Domain.Users;

namespace Workflow.Application.Users;

public interface IUserRepository
{
    Task AddAsync(User user, CancellationToken ct);
    Task<User?> GetAsync(Guid id, CancellationToken ct);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
    Task<IReadOnlyList<User>> ListAsync(CancellationToken ct);
}
