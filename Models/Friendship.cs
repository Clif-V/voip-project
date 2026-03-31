using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VoipBackend.Models
{
    public class Friendship
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public int User1Id { get; set; }
        [Required]
        public int User2Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}