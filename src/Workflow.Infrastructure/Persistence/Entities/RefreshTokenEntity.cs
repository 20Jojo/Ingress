using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Workflow.Infrastructure.Persistence.Entities;

[Table("refresh_tokens")]
public sealed class RefreshTokenEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    // store HASH, not raw token
    [Required]
    [MaxLength(64)]
    [Column("token_hash")]
    public string TokenHash { get; set; } = default!;

    [Column("created_at_utc")]
    public DateTimeOffset CreatedAtUtc { get; set; }

    [Column("expires_at_utc")]
    public DateTimeOffset ExpiresAtUtc { get; set; }

    [Column("revoked_at_utc")]
    public DateTimeOffset? RevokedAtUtc { get; set; }

    [Column("replaced_by_token_hash")]
    [MaxLength(64)]
    public string? ReplacedByTokenHash { get; set; }
}
