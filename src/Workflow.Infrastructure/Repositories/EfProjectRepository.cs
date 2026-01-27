using Microsoft.EntityFrameworkCore;
using Workflow.Application.Projects;
using Workflow.Domain.Projects;
using Workflow.Infrastructure.Persistence;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Repositories;

public sealed class EfProjectRepository : IProjectRepository
{
    private readonly WorkflowDbContext _db;

    public EfProjectRepository(WorkflowDbContext db) => _db = db;

    public Task AddAsync(Project project, CancellationToken ct)
    {
        var entity = new ProjectEntity
        {
            Id = project.Id,
            OrganizationId = project.OrganizationId,
            Name = project.Name
        };

        _db.Projects.Add(entity);
        return Task.CompletedTask; // SaveChanges via UnitOfWork
    }

    public async Task<Project?> GetAsync(Guid id, CancellationToken ct)
    {
        var entity = await _db.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        return entity is null ? null : new Project(entity.Id, entity.OrganizationId, entity.Name);
    }

    public async Task<IReadOnlyList<Project>> ListByOrganizationAsync(Guid orgId, CancellationToken ct)
    {
        var entities = await _db.Projects
            .AsNoTracking()
            .Where(x => x.OrganizationId == orgId)
            .OrderBy(x => x.Name)
            .ToListAsync(ct);

        return entities.Select(x => new Project(x.Id, x.OrganizationId, x.Name)).ToList();
    }

    public async Task<Guid?> GetOrganizationIdAsync(Guid projectId, CancellationToken ct)
    {
        return await _db.Projects
            .AsNoTracking()
            .Where(x => x.Id == projectId)
            .Select(x => (Guid?)x.OrganizationId)
            .FirstOrDefaultAsync(ct);
    }
}
