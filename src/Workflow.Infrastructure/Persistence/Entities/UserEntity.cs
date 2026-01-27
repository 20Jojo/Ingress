namespace Workflow.Infrastructure.Persistence.Entities;

public sealed class UserEntity
{
    public Guid Id { get; set; }
    public string Email { get; set; } = default!;
    public string DisplayName { get; set; } = default!;
}
