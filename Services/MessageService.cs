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

        public async Task<Conversation?> GetConversationByToken(string token)
        {
            return await _context.Conversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Token == token);
        }

        public async Task<Conversation> GetOrCreateConversation(string token)
        {
            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.Token == token);

            if (conversation != null) return conversation;

            conversation = new Conversation { Token = token };
            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            return conversation;
        }

        public async Task<Message?> AddMessage(string content, int conversationId, string Iv)
        {
            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.Id == conversationId);
            if (conversation == null) return null;

            var message = new Message
            {
                Content = content,
                ConversationId = conversationId,
                Iv = Iv
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return message;
        }
    }
}
