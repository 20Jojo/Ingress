namespace Workflow.Infrastructure.Persistence.Entities;

public sealed class OrgInvitationEntity
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }
    public string Email { get; set; } = default!;

    public int Role { get; set; }

    public string Token { get; set; } = default!;
    public DateTimeOffset ExpiresAtUtc { get; set; }

    public Guid CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }

    public Guid? AcceptedByUserId { get; set; }
    public DateTimeOffset? AcceptedAtUtc { get; set; }

    public Guid? RevokedByUserId { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
}
