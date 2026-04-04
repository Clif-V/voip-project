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

                entity.HasIndex(u => u.PublicKey)
                .IsUnique();

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
                entity.HasOne(f => f.User1)
                .WithMany()
                .HasForeignKey(f => f.User1Id)
                .OnDelete(DeleteBehavior.Restrict);

                entity
                .HasOne(f => f.User2)
                .WithMany()
                .HasForeignKey(f => f.User2Id)
                .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ConversationParticipant>()
                .HasKey(cp => new {cp.ConversationId, cp.UserId});

            modelBuilder.Entity<ConversationParticipant>()
                .HasOne(cp => cp.Conversation)
                .WithMany(c => c.Participants)
                .HasForeignKey(cp => cp.ConversationId);

            modelBuilder.Entity<ConversationParticipant>()
                .HasOne(cp => cp.User)
                .WithMany(u => u.Conversations)
                .HasForeignKey(cp => cp.UserId);

            modelBuilder.Entity<Message>()
                .HasKey(m => m.Id);
            
            modelBuilder.Entity<Message>()
                .HasIndex(m => new {m.ConversationId, m.Timestamp});

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Conversation>()
                .HasMany(c => c.Messages)
                .WithOne(c => c.Conversation)
                .HasForeignKey(c => c.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        }
        

        public DbSet<User> Users { get; set; }
        public DbSet<FriendRequest> FriendRequests { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<ConversationParticipant> ConversationParticipants { get; set; }
        public DbSet<Message> Messages { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

    }
}