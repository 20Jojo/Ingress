using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Workflow.Infrastructure.Persistence.Entities;

[Table("users")]
public sealed class UserEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(320)]
    [Column("email")]
    public string Email { get; set; } = default!;

    [Required]
    [MaxLength(120)]
    [Column("display_name")]
    public string DisplayName { get; set; } = default!;

    // REQUIRED (your DB says NOT NULL)
    [Required]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = default!;
}
