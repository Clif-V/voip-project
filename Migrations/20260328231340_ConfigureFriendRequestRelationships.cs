using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VoipBackend.Migrations
{
    /// <inheritdoc />
    public partial class ConfigureFriendRequestRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FriendRequest_Users_UserId",
                table: "FriendRequest");

            migrationBuilder.DropForeignKey(
                name: "FK_FriendRequest_Users_UserId1",
                table: "FriendRequest");

            migrationBuilder.DropForeignKey(
                name: "FK_Friendship_Users_UserId",
                table: "Friendship");

            migrationBuilder.DropIndex(
                name: "IX_Friendship_UserId",
                table: "Friendship");

            migrationBuilder.DropIndex(
                name: "IX_FriendRequest_UserId",
                table: "FriendRequest");

            migrationBuilder.DropIndex(
                name: "IX_FriendRequest_UserId1",
                table: "FriendRequest");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Friendship");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "FriendRequest");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "FriendRequest");

            migrationBuilder.CreateIndex(
                name: "IX_Friendship_User1Id",
                table: "Friendship",
                column: "User1Id");

            migrationBuilder.CreateIndex(
                name: "IX_FriendRequest_FromUserId",
                table: "FriendRequest",
                column: "FromUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FriendRequest_ToUserId",
                table: "FriendRequest",
                column: "ToUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_FriendRequest_Users_FromUserId",
                table: "FriendRequest",
                column: "FromUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FriendRequest_Users_ToUserId",
                table: "FriendRequest",
                column: "ToUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Friendship_Users_User1Id",
                table: "Friendship",
                column: "User1Id",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FriendRequest_Users_FromUserId",
                table: "FriendRequest");

            migrationBuilder.DropForeignKey(
                name: "FK_FriendRequest_Users_ToUserId",
                table: "FriendRequest");

            migrationBuilder.DropForeignKey(
                name: "FK_Friendship_Users_User1Id",
                table: "Friendship");

            migrationBuilder.DropIndex(
                name: "IX_Friendship_User1Id",
                table: "Friendship");

            migrationBuilder.DropIndex(
                name: "IX_FriendRequest_FromUserId",
                table: "FriendRequest");

            migrationBuilder.DropIndex(
                name: "IX_FriendRequest_ToUserId",
                table: "FriendRequest");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Friendship",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "FriendRequest",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId1",
                table: "FriendRequest",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Friendship_UserId",
                table: "Friendship",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FriendRequest_UserId",
                table: "FriendRequest",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FriendRequest_UserId1",
                table: "FriendRequest",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_FriendRequest_Users_UserId",
                table: "FriendRequest",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FriendRequest_Users_UserId1",
                table: "FriendRequest",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Friendship_Users_UserId",
                table: "Friendship",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
