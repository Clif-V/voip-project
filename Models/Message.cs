using Microsoft.EntityFrameworkCore.Metadata;
using VoipBackend.Models;

public class Message
{
    public int Id { get; set; }
    public string Content { get; set;}
    public int SenderId { get; set; }
    public User Sender { get; set; }
    public int ConversationId { get; set; }
    public Conversation Conversation { get; set; } // need to encrypt
    public DateTime Timestamp { get; set;} = DateTime.UtcNow;
}