using Workflow.Domain.Organizations;

namespace Workflow.Application.Organizations;

public interface IOrgInvitationRepository
{
    Task AddAsync(OrgInvitation invitation, CancellationToken ct);
    Task<IReadOnlyList<OrgInvitation>> ListByOrgAsync(Guid orgId, CancellationToken ct);
    Task<OrgInvitation?> GetByTokenAsync(string token, CancellationToken ct);
    Task MarkAcceptedAsync(Guid invitationId, Guid acceptedByUserId, DateTimeOffset acceptedAtUtc, CancellationToken ct);
    Task MarkRevokedAsync(Guid invitationId, Guid revokedByUserId, DateTimeOffset revokedAtUtc, CancellationToken ct);
}
