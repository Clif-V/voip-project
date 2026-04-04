namespace VoipBackend.Models
{
    public class Conversation
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<ConversationParticipant> Participants { get; set; } = [];
        public ICollection<Message> Messages { get; set; } = [];
    }
}