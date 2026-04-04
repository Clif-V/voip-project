using VoipBackend.Models;
using VoipBackend.Data;
using Microsoft.EntityFrameworkCore;

namespace VoipBackend.Services
{
    public class MessageService
    {
        private readonly AppDbContext _context;

        public MessageService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Conversation> GetConversation(int conversationId)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Participants)
                .Include(c => c.Messages)
                    .ThenInclude(m => m.Sender)
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null) throw new Exception("Conversation not found");
            return conversation;
        }

        public async Task<Conversation> GetOrCreateConversation(int senderId, int recipientId)
        {
            // Look for an existing conversation that contains both users and no one else
            var conversation = await _context.Conversations
                .Include(c => c.Participants)
                .Where(c => c.Participants.Any(p => p.UserId == senderId)
                         && c.Participants.Any(p => p.UserId == recipientId)
                         && c.Participants.Count == 2)
                .FirstOrDefaultAsync();

            if (conversation != null) return conversation;

            // Create a new conversation
            conversation = new Conversation();
            conversation.Participants.Add(new ConversationParticipant { UserId = senderId });
            conversation.Participants.Add(new ConversationParticipant { UserId = recipientId });

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            return conversation;
        }

        public async Task<Message?> AddMessage(string content, int senderId, int conversationId, string Iv)
        {
            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.Id == conversationId);
            if (conversation == null) return null;

            var message = new Message
            {
                Content = content,
                SenderId = senderId,
                ConversationId = conversationId,
                Iv = Iv
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return message;
        }
    }
}