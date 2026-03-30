using System.ComponentModel.DataAnnotations;

namespace VoipBackend.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        public ICollection<Friendship> Friendships { get; set; } = [];
        public ICollection<FriendRequest> SentRequests { get; set; } = [];
        public ICollection<FriendRequest> ReceivedRequests { get; set; } = [];
    }
}