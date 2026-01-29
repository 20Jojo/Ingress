using Workflow.Domain.Organizations;

namespace Workflow.Application.Organizations;

public interface IOrgMemberAuditRepository
{
    Task AddAsync(
        Guid orgId,
        Guid actorUserId,
        Guid targetUserId,
        OrgMemberAuditAction action,
        OrgRole? fromRole,
        OrgRole? toRole,
        DateTimeOffset occurredAtUtc,
        CancellationToken ct);

    Task<IReadOnlyList<OrgMemberAuditRecord>> ListByOrgAsync(Guid orgId, int take, CancellationToken ct);
}

public sealed record OrgMemberAuditRecord(
    Guid Id,
    Guid OrganizationId,
    Guid ActorUserId,
    Guid TargetUserId,
    OrgMemberAuditAction Action,
    OrgRole? FromRole,
    OrgRole? ToRole,
    DateTimeOffset OccurredAt);
