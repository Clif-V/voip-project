using Microsoft.EntityFrameworkCore;
using VoipBackend.Models;

namespace VoipBackend.Data
{
    public class AppDbContext : DbContext
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Username).IsUnique();
                entity.HasIndex(u => u.Email).IsUnique();

                // Configure FriendRequest relationships
                entity.HasMany(u => u.SentRequests)
                    .WithOne()
                    .HasForeignKey(fr => fr.FromUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.ReceivedRequests)
                    .WithOne()
                    .HasForeignKey(fr => fr.ToUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Configure Friendship relationships
                entity.HasMany(u => u.Friendships)
                    .WithOne()
                    .HasForeignKey(f => f.User1Id)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
        public DbSet<User> Users { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }
    }
}