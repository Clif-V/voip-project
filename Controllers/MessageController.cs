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
            var message = await _messageService.AddMessage(input.Message, sender.Id, conversation.Id);
            if (message == null) return BadRequest("Failed to save message.");

            if (SignalingHub.users.TryGetValue(input.ToUsername, out var recipientConnectionId))
            {
                await _hubContext.Clients.Client(recipientConnectionId)
                    .SendAsync("ReceiveMessage", senderUsername, input.Message);
            }

            return Ok(new { conversationId = conversation.Id, messageId = message.Id });
        }
    }
}