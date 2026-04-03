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
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null) throw new Exception("Conversation not found");
            return conversation;
        }

        public async Task<Conversation> GetOrCreateConversation(int userAId, int userBId)
        {
            // Look for an existing conversation that contains both users and no one else
            var conversation = await _context.Conversations
                .Include(c => c.Participants)
                .Where(c => c.Participants.Any(p => p.UserId == userAId)
                         && c.Participants.Any(p => p.UserId == userBId)
                         && c.Participants.Count == 2)
                .FirstOrDefaultAsync();

            if (conversation != null) return conversation;

            // Create a new conversation
            conversation = new Conversation();
            conversation.Participants.Add(new ConversationParticipant { UserId = userAId });
            conversation.Participants.Add(new ConversationParticipant { UserId = userBId });

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            return conversation;
        }

        public async Task<Message?> AddMessage(string content, int senderId, int conversationId)
        {
            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.Id == conversationId);
            if (conversation == null) return null;

            var message = new Message
            {
                Content = content,
                SenderId = senderId,
                ConversationId = conversationId
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return message;
        }
    }
}