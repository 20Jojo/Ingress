using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Persistence.Configurations;

public sealed class ProjectConfig : IEntityTypeConfiguration<ProjectEntity>
{
    public void Configure(EntityTypeBuilder<ProjectEntity> b)
    {
        b.ToTable("projects");
        b.HasKey(x => x.Id);

        b.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(120)
            .IsRequired();

        b.Property(x => x.OrganizationId).HasColumnName("organization_id");

        b.HasMany(x => x.Tasks)
            .WithOne(x => x.Project!)
            .HasForeignKey(x => x.ProjectId);
    }
}
