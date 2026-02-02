namespace Workflow.Domain.Users;

public sealed class User
{
    public Guid Id { get; }
    public string Email { get; }
    public string DisplayName { get; }
    public string PasswordHash { get; }

    public User(Guid id, string email, string displayName, string passwordHash)
    {
        Id = id;
        Email = email;
        DisplayName = displayName;
        PasswordHash = passwordHash;
    }
}
