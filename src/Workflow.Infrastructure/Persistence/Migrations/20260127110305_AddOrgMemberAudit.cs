using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Workflow.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrgMemberAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "org_member_audit",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<int>(type: "integer", nullable: false),
                    from_role = table.Column<int>(type: "integer", nullable: true),
                    to_role = table.Column<int>(type: "integer", nullable: true),
                    occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_org_member_audit", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_org_member_audit_actor_user_id",
                table: "org_member_audit",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_org_member_audit_occurred_at",
                table: "org_member_audit",
                column: "occurred_at");

            migrationBuilder.CreateIndex(
                name: "IX_org_member_audit_organization_id",
                table: "org_member_audit",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_org_member_audit_target_user_id",
                table: "org_member_audit",
                column: "target_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "org_member_audit");
        }
    }
}
