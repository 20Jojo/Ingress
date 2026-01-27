using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Workflow.Infrastructure.Persistence.Entities;

namespace Workflow.Infrastructure.Persistence.Configurations;

public sealed class OrganizationConfig : IEntityTypeConfiguration<OrganizationEntity>
{
    public void Configure(EntityTypeBuilder<OrganizationEntity> b)
    {
        b.ToTable("organizations");
        b.HasKey(x => x.Id);

        b.Property(x => x.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();

        b.HasMany(x => x.Projects)
            .WithOne(x => x.Organization!)
            .HasForeignKey(x => x.OrganizationId);
    }
}
