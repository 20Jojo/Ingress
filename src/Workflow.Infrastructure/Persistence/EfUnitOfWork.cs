using Workflow.Application.Common;

namespace Workflow.Infrastructure.Persistence;

public sealed class EfUnitOfWork : IUnitOfWork
{
    private readonly WorkflowDbContext _db;

    public EfUnitOfWork(WorkflowDbContext db) => _db = db;

    public Task SaveChangesAsync(CancellationToken ct)
        => _db.SaveChangesAsync(ct);
}
