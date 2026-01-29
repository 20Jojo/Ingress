namespace Workflow.Infrastructure.Persistence.Entities;

public sealed class OrgMemberAuditEntity
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }
    public Guid ActorUserId { get; set; }
    public Guid TargetUserId { get; set; }

    // Stored as int in DB
    public int Action { get; set; }

    public int? FromRole { get; set; }
    public int? ToRole { get; set; }

    // Column name in DB is occurred_at
    public DateTimeOffset OccurredAt { get; set; }
}
