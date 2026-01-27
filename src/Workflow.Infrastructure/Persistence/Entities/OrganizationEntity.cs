namespace Workflow.Infrastructure.Persistence.Entities;

public sealed class OrganizationEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<ProjectEntity> Projects { get; set; } = new();
}
