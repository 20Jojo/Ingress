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
            b.Property(x => x.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
            b.Property(x => x.DisplayName).HasColumnName("display_name").HasMaxLength(120).IsRequired();
            b.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<OrgMemberEntity>(b =>
        {
            b.ToTable("org_members");
            b.HasKey(x => new { x.OrganizationId, x.UserId });

            b.Property(x => x.OrganizationId).HasColumnName("organization_id").IsRequired();
            b.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            b.Property(x => x.Role).HasColumnName("role").IsRequired();
            b.Property(x => x.JoinedAt).HasColumnName("joined_at").IsRequired();

            b.HasIndex(x => x.OrganizationId);
            b.HasIndex(x => x.UserId);
        });
    }
}
