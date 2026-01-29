using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Workflow.Infrastructure.Persistence.Migrations
{
    public partial class AddOrgMemberSoftDeleteToOrgMembers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "org_members",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "deleted_at_utc",
                table: "org_members",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "deleted_by_user_id",
                table: "org_members",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_org_members_organization_id_is_deleted",
                table: "org_members",
                columns: new[] { "organization_id", "is_deleted" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_org_members_organization_id_is_deleted",
                table: "org_members");

            migrationBuilder.DropColumn(
                name: "deleted_by_user_id",
                table: "org_members");

            migrationBuilder.DropColumn(
                name: "deleted_at_utc",
                table: "org_members");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "org_members");
        }
    }
}
