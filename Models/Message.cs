namespace VoipBackend.Models
{
    public class Message
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public int SenderId { get; set; }
        public User Sender { get; set; } = null!;
        public int ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Iv { get; set; } = string.Empty;
    }
}