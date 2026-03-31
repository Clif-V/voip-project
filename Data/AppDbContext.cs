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
                    .WithOne(fr => fr.FromUser)
                    .HasForeignKey(fr => fr.FromUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.ReceivedRequests)
                    .WithOne(fr => fr.ToUser)
                    .HasForeignKey(fr => fr.ToUserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            modelBuilder.Entity<Friendship>(entity =>
            {
                entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(f => f.User1Id)
                .OnDelete(DeleteBehavior.Restrict);

                entity
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(f => f.User2Id)
                .OnDelete(DeleteBehavior.Restrict);
            });
        }
        public DbSet<User> Users { get; set; }
        public DbSet<FriendRequest> FriendRequests { get; set; }
        public DbSet<Friendship> Friendships { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }
    }
}