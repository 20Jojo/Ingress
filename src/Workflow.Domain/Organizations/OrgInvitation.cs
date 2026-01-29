namespace Workflow.Domain.Organizations;

public sealed class OrgInvitation
{
    public Guid Id { get; }
    public Guid OrganizationId { get; }
    public string Email { get; }
    public OrgRole Role { get; }
    public string Token { get; }
    public DateTimeOffset ExpiresAtUtc { get; }

    public Guid CreatedByUserId { get; }
    public DateTimeOffset CreatedAtUtc { get; }

    public Guid? AcceptedByUserId { get; private set; }
    public DateTimeOffset? AcceptedAtUtc { get; private set; }

    public Guid? RevokedByUserId { get; private set; }
    public DateTimeOffset? RevokedAtUtc { get; private set; }

    public OrgInvitation(
        Guid id,
        Guid organizationId,
        string email,
        OrgRole role,
        string token,
        DateTimeOffset expiresAtUtc,
        Guid createdByUserId,
        DateTimeOffset createdAtUtc,
        Guid? acceptedByUserId,
        DateTimeOffset? acceptedAtUtc,
        Guid? revokedByUserId,
        DateTimeOffset? revokedAtUtc)
    {
        Id = id;
        OrganizationId = organizationId;

        Email = NormalizeEmail(email);
        Role = role;

        Token = token;
        ExpiresAtUtc = expiresAtUtc;

        CreatedByUserId = createdByUserId;
        CreatedAtUtc = createdAtUtc;

        AcceptedByUserId = acceptedByUserId;
        AcceptedAtUtc = acceptedAtUtc;

        RevokedByUserId = revokedByUserId;
        RevokedAtUtc = revokedAtUtc;
    }

    public bool IsExpired(DateTimeOffset nowUtc) => nowUtc >= ExpiresAtUtc;
    public bool IsAccepted => AcceptedAtUtc is not null;
    public bool IsRevoked => RevokedAtUtc is not null;

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
