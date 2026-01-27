namespace Workflow.Domain.Organizations;

public sealed class Organization
{
    public Guid Id { get; }
    public string Name { get; private set; }

    public Organization(Guid id, string name)
    {
        if (id == Guid.Empty) throw new ArgumentException("Organization id cannot be empty.", nameof(id));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Organization name is required.", nameof(name));

        Id = id;
        Name = name.Trim();
    }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Organization name is required.", nameof(name));
        Name = name.Trim();
    }
}
