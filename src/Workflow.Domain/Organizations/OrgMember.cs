using Workflow.Domain.Users;

namespace Workflow.Domain.Organizations;

public sealed class OrgMember
{
    public Guid OrganizationId { get; }
    public Guid UserId { get; }
    public OrgRole Role { get; private set; }
    public DateTimeOffset JoinedAt { get; }

    public OrgMember(Guid organizationId, Guid userId, OrgRole role, DateTimeOffset joinedAt)
    {
        if (organizationId == Guid.Empty) throw new ArgumentException("Organization id cannot be empty.", nameof(organizationId));
        if (userId == Guid.Empty) throw new ArgumentException("User id cannot be empty.", nameof(userId));

        OrganizationId = organizationId;
        UserId = userId;
        Role = role;
        JoinedAt = joinedAt;
    }

    public static OrgMember Create(Guid organizationId, Guid userId, OrgRole role)
        => new(organizationId, userId, role, DateTimeOffset.UtcNow);

    public void ChangeRole(OrgRole role) => Role = role;
}
