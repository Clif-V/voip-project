using Microsoft.AspNetCore.Mvc;
using VoipBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using VoipBackend.Hubs;
using VoipBackend.Models;

namespace VoipBackend.Controllers
{
    [ApiController]
    [Route("message")]
    public class MessageController(FriendService friendService, MessageService messageService, IHubContext<SignalingHub> hubContext) : ControllerBase
    {
        private readonly FriendService _friendService = friendService;
        private readonly MessageService _messageService = messageService;
        private readonly IHubContext<SignalingHub> _hubContext = hubContext;

        [Authorize]
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] MessageRequest input)
        {
            var senderUsername = User.Identity?.Name;
            if (string.IsNullOrEmpty(senderUsername)) return Unauthorized();

            var sender = await _friendService.GetUserByUsername(senderUsername);
            var recipient = await _friendService.GetUserByUsername(input.ToUsername);
            if (sender == null || recipient == null) return NotFound("User not found.");

            var conversation = await _messageService.GetOrCreateConversation(sender.Id, recipient.Id);
            var message = await _messageService.AddMessage(input.Message, sender.Id, conversation.Id, input.Iv);
            if (message == null) return BadRequest("Failed to save message.");

            if (SignalingHub.users.TryGetValue(input.ToUsername, out var recipientConnectionId))
            {
                await _hubContext.Clients.Client(recipientConnectionId)
                    .SendAsync("ReceiveMessage", senderUsername, input.Message, input.Iv);
            }

            return Ok(new { conversationId = conversation.Id, messageId = message.Id });
        }

        [Authorize]
        [HttpPost("conversation")]
        public async Task<IActionResult> CreateConversation([FromBody] ConversationRequest input)
        {
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var user = await _friendService.GetUserByUsername(username);
            if (user == null) return NotFound("User not found");

            var otherUser = await _friendService.GetUserByUsername(input.WithUsername);
            if (otherUser == null) return NotFound("User not found");

            var conversation = await _messageService.GetOrCreateConversation(user.Id, otherUser.Id);
            return Ok(conversation);
        }

        [Authorize]
        [HttpGet("conversation/{conversationId}")]
        public async Task<IActionResult> GetConversation([FromRoute] int conversationId){
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var user = await _friendService.GetUserByUsername(username);
            if (user == null) return NotFound("User not found");

            var conversation = await _messageService.GetConversation(conversationId);
            if (conversation == null) return NotFound("Conversation not found");

            if (!conversation.Participants.Any(p => p.UserId == user.Id))
                return Forbid("You are not a participant in this conversation.");

            return Ok(conversation);
        }

        [Authorize]
        [HttpGet("history/{conversationId}")]
        public async Task<IActionResult> GetMessageHistory(int conversationId)
        {
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var user = await _friendService.GetUserByUsername(username);
            if (user == null) return NotFound("User not found");

            var conversation = await _messageService.GetConversation(conversationId);
            if (conversation == null) return NotFound("Conversation not found");

            if (!conversation.Participants.Any(p => p.UserId == user.Id))
                return Forbid("You are not a participant in this conversation.");

            var messages = conversation.Messages
                .OrderBy(m => m.Timestamp)
                .Select(m => new
                {
                    m.Content,
                    m.Iv,
                    m.Timestamp,
                    senderUsername = m.Sender.Username,
                    isSentByCurrentUser = m.SenderId == user.Id
                });

            return Ok(messages);
        }
    }
}