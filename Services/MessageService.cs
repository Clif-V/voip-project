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

        public async Task<Message?> AddMessage(string content, int senderId, int conversationId)
        {
            var sender = await _context.Users.FirstOrDefaultAsync(u => u.Id == senderId);
            if (sender == null) return null;

            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.Id == conversationId);
            if (conversation == null) return null;

            var message = new Message
            {
                Content = content,
                SenderId = senderId,
                ConversationId = conversationId,
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return message;
        }
    }
}