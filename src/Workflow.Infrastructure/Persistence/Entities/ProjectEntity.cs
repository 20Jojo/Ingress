namespace Workflow.Infrastructure.Persistence.Entities;

public sealed class ProjectEntity
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;

    public OrganizationEntity? Organization { get; set; }
    public List<TaskEntity> Tasks { get; set; } = new();
}
