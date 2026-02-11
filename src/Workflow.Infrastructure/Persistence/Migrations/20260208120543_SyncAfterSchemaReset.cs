using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Workflow.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncAfterSchemaReset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // If the index exists with this name, DropIndex will succeed.
            // If it doesn't exist, this might fail depending on your DB state.
            // Since your error is coming from RenameColumn, we remove those and keep schema stable.
            migrationBuilder.DropIndex(
                name: "IX_users_email",
                table: "users");

            // Recreate the expected unique index (EF wants this)
            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverse of Up(): drop the index
            migrationBuilder.DropIndex(
                name: "IX_users_email",
                table: "users");
        }
    }
}
