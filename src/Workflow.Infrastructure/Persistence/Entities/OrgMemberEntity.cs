namespace Workflow.Infrastructure.Persistence.Entities;

public sealed class OrgMemberEntity
{
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }

    public int Role { get; set; }
    public DateTimeOffset JoinedAt { get; set; }
}
