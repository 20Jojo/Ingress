using Microsoft.EntityFrameworkCore;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Persistence;

public sealed class WorkflowDbContext : DbContext
{
    public WorkflowDbContext(DbContextOptions<WorkflowDbContext> options) : base(options) { }

    public DbSet<OrganizationEntity> Organizations => Set<OrganizationEntity>();
    public DbSet<ProjectEntity> Projects => Set<ProjectEntity>();
    public DbSet<TaskEntity> Tasks => Set<TaskEntity>();

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<OrgMemberEntity> OrgMembers => Set<OrgMemberEntity>();
    public DbSet<RefreshTokenEntity> RefreshTokens => Set<RefreshTokenEntity>();

    public DbSet<OrgMemberAuditEntity> OrgMemberAudits => Set<OrgMemberAuditEntity>();
    public DbSet<OrgInvitationEntity> OrgInvitations => Set<OrgInvitationEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<OrganizationEntity>(b =>
        {
            b.ToTable("organizations");
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<ProjectEntity>(b =>
        {
            b.ToTable("projects");
            b.HasKey(x => x.Id);
            b.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            b.Property(x => x.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
            b.HasIndex(x => x.OrganizationId).HasDatabaseName("IX_projects_organization_id");
        });

        modelBuilder.Entity<TaskEntity>(b =>
        {
            b.ToTable("tasks");
            b.HasKey(x => x.Id);
            b.Property(x => x.ProjectId).HasColumnName("project_id").IsRequired();
            b.Property(x => x.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
            b.Property(x => x.Description).HasColumnName("description").HasMaxLength(2000);
            b.Property(x => x.Status).HasColumnName("status").IsRequired();
            b.Property(x => x.AssigneeUserId).HasColumnName("assignee_user_id");
            b.Property(x => x.DueAt).HasColumnName("due_at");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            b.HasIndex(x => x.ProjectId).HasDatabaseName("IX_tasks_project_id");
        });

        modelBuilder.Entity<UserEntity>(b =>
        {
            b.ToTable("users");

            b.HasKey(x => x.Id);
            b.Property(x => x.Id)
                .HasColumnName("Id");   

            b.Property(x => x.Email)
                .HasColumnName("email")
                .HasMaxLength(320)
                .IsRequired();

            b.Property(x => x.DisplayName)
                .HasColumnName("display_name")
                .HasMaxLength(120)
                .IsRequired();

            b.Property(x => x.PasswordHash)
                .HasColumnName("PasswordHash")
                .IsRequired();
        });

        modelBuilder.Entity<OrgMemberEntity>(b =>
        {
            b.ToTable("org_members");
            b.HasKey(x => new { x.OrganizationId, x.UserId });

            b.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            b.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            b.Property(x => x.Role).HasColumnName("role").IsRequired();
            b.Property(x => x.JoinedAt).HasColumnName("joined_at").IsRequired();

            b.Property(x => x.IsDeleted).HasColumnName("is_deleted").IsRequired();
            b.Property(x => x.DeletedAtUtc).HasColumnName("deleted_at_utc");
            b.Property(x => x.DeletedByUserId).HasColumnName("deleted_by_user_id");

            b.HasIndex(x => x.OrganizationId);
            b.HasIndex(x => x.UserId);
            b.HasIndex(x => new { x.OrganizationId, x.IsDeleted }).HasDatabaseName("IX_org_members_organization_id_is_deleted");
        });

        modelBuilder.Entity<OrgMemberAuditEntity>(b =>
        {
            b.ToTable("org_member_audit");
            b.HasKey(x => x.Id);

            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            b.Property(x => x.ActorUserId).HasColumnName("actor_user_id").IsRequired();
            b.Property(x => x.TargetUserId).HasColumnName("target_user_id").IsRequired();

            b.Property(x => x.Action).HasColumnName("action").IsRequired();
            b.Property(x => x.FromRole).HasColumnName("from_role");
            b.Property(x => x.ToRole).HasColumnName("to_role");

            b.Property(x => x.OccurredAt).HasColumnName("occurred_at").IsRequired();

            b.HasIndex(x => x.OrganizationId).HasDatabaseName("IX_org_member_audit_organization_id");
            b.HasIndex(x => x.ActorUserId).HasDatabaseName("IX_org_member_audit_actor_user_id");
            b.HasIndex(x => x.TargetUserId).HasDatabaseName("IX_org_member_audit_target_user_id");
            b.HasIndex(x => x.OccurredAt).HasDatabaseName("IX_org_member_audit_occurred_at");
        });

        modelBuilder.Entity<OrgInvitationEntity>(b =>
        {
            b.ToTable("org_invitations");
            b.HasKey(x => x.Id);

            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();

            b.Property(x => x.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
            b.Property(x => x.Role).HasColumnName("role").IsRequired();

            b.Property(x => x.Token).HasColumnName("token").HasMaxLength(80).IsRequired();
            b.Property(x => x.ExpiresAtUtc).HasColumnName("expires_at_utc").IsRequired();

            b.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id").IsRequired();
            b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();

            b.Property(x => x.AcceptedByUserId).HasColumnName("accepted_by_user_id");
            b.Property(x => x.AcceptedAtUtc).HasColumnName("accepted_at_utc");

            b.Property(x => x.RevokedByUserId).HasColumnName("revoked_by_user_id");
            b.Property(x => x.RevokedAtUtc).HasColumnName("revoked_at_utc");

            b.HasIndex(x => x.OrganizationId).HasDatabaseName("IX_org_invitations_organization_id");
            b.HasIndex(x => x.Email).HasDatabaseName("IX_org_invitations_email");
            b.HasIndex(x => x.Token).IsUnique().HasDatabaseName("UX_org_invitations_token");
        });

        modelBuilder.Entity<RefreshTokenEntity>(b =>
        {
            b.ToTable("refresh_tokens");
            b.HasKey(x => x.Id);

            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.UserId).HasColumnName("user_id");

            b.Property(x => x.TokenHash)
                .HasColumnName("token_hash")
                .HasMaxLength(64)
                .IsRequired();

            b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
            b.Property(x => x.ExpiresAtUtc).HasColumnName("expires_at_utc").IsRequired();
            b.Property(x => x.RevokedAtUtc).HasColumnName("revoked_at_utc");
            b.Property(x => x.ReplacedByTokenHash)
                .HasColumnName("replaced_by_token_hash")
                .HasMaxLength(64);

            b.HasIndex(x => x.TokenHash).IsUnique();
            b.HasIndex(x => x.UserId);
        });
    }
}
