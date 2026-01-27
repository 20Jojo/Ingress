namespace Workflow.Domain.Projects;

public sealed class Project
{
    public Guid Id { get; }
    public Guid OrganizationId { get; }
    public string Name { get; private set; }

    public Project(Guid id, Guid organizationId, string name)
    {
        if (id == Guid.Empty) throw new ArgumentException("Project id cannot be empty.", nameof(id));
        if (organizationId == Guid.Empty) throw new ArgumentException("Organization id cannot be empty.", nameof(organizationId));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Project name is required.", nameof(name));

        Id = id;
        OrganizationId = organizationId;
        Name = name.Trim();
    }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Project name is required.", nameof(name));
        Name = name.Trim();
    }
}
