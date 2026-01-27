using Microsoft.EntityFrameworkCore;
using Workflow.Application.Organizations;
using Workflow.Domain.Organizations;
using Workflow.Infrastructure.Persistence;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Repositories;

public sealed class EfOrganizationRepository : IOrganizationRepository
{
    private readonly WorkflowDbContext _db;

    public EfOrganizationRepository(WorkflowDbContext db) => _db = db;

    public async Task AddAsync(Organization org, CancellationToken ct)
    {
        var entity = new OrganizationEntity
        {
            Id = org.Id,
            Name = org.Name
        };

        _db.Organizations.Add(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<Organization?> GetAsync(Guid id, CancellationToken ct)
    {
        var entity = await _db.Organizations
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        return entity is null ? null : new Organization(entity.Id, entity.Name);
    }

    public async Task<IReadOnlyList<Organization>> ListAsync(CancellationToken ct)
    {
        var entities = await _db.Organizations
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync(ct);

        return entities
            .Select(x => new Organization(x.Id, x.Name))
            .ToList();
    }
}
