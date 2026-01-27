namespace Workflow.Domain.Users;

public sealed class User
{
    public Guid Id { get; }
    public string Email { get; private set; }
    public string DisplayName { get; private set; }

    public User(Guid id, string email, string displayName)
    {
        if (id == Guid.Empty) throw new ArgumentException("User id cannot be empty.", nameof(id));
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email is required.", nameof(email));
        if (string.IsNullOrWhiteSpace(displayName)) throw new ArgumentException("Display name is required.", nameof(displayName));

        Id = id;
        Email = NormalizeEmail(email);
        DisplayName = displayName.Trim();
    }

    public void UpdateProfile(string displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName)) throw new ArgumentException("Display name is required.", nameof(displayName));
        DisplayName = displayName.Trim();
    }

    public void ChangeEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email is required.", nameof(email));
        Email = NormalizeEmail(email);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
