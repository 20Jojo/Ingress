using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Persistence.Configurations;

public sealed class TaskConfig : IEntityTypeConfiguration<TaskEntity>
{
    public void Configure(EntityTypeBuilder<TaskEntity> b)
    {
        b.ToTable("tasks");
        b.HasKey(x => x.Id);

        b.Property(x => x.ProjectId).HasColumnName("project_id");

        b.Property(x => x.Title)
            .HasColumnName("title")
            .HasMaxLength(200)
            .IsRequired();

        b.Property(x => x.Description)
            .HasColumnName("description")
            .HasMaxLength(2000);

        b.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<int>()
            .IsRequired();

        b.Property(x => x.AssigneeUserId).HasColumnName("assignee_user_id");
        b.Property(x => x.DueAt).HasColumnName("due_at");

        b.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();
    }
}
