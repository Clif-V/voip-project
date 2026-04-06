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
    public class MessageController(MessageService messageService, IHubContext<SignalingHub> hubContext) : ControllerBase
    {
        private readonly MessageService _messageService = messageService;
        private readonly IHubContext<SignalingHub> _hubContext = hubContext;

        [Authorize]
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] MessageRequest input)
        {
            if (string.IsNullOrWhiteSpace(input.Token) || input.Token.Length != 64)
                return BadRequest("Invalid conversation token.");

            // Sender identity is embedded inside the encrypted content — not stored in DB
            var conversation = await _messageService.GetOrCreateConversation(input.Token);
            var message = await _messageService.AddMessage(input.Message, conversation.Id, input.Iv);
            if (message == null) return BadRequest("Failed to save message.");

            // Route in RAM only; ToUsername is never persisted
            if (!string.IsNullOrEmpty(input.ToUsername) &&
                SignalingHub.users.TryGetValue(input.ToUsername, out var recipientConnectionId))
            {
                await _hubContext.Clients.Client(recipientConnectionId)
                    .SendAsync("ReceiveMessage", input.Token, input.Message, input.Iv);
            }

            return Ok(new { conversationId = conversation.Id, messageId = message.Id });
        }

        [Authorize]
        [HttpGet("history/{token}")]
        public async Task<IActionResult> GetMessageHistory(string token)
        {
            if (string.IsNullOrWhiteSpace(token) || token.Length != 64)
                return BadRequest("Invalid conversation token.");

            // Knowledge of the 256-bit token is the authorization proof; JWT ensures authentication
            var conversation = await _messageService.GetConversationByToken(token);
            if (conversation == null) return Ok(Array.Empty<object>());

            var messages = conversation.Messages
                .OrderBy(m => m.Timestamp)
                .Select(m => new { m.Content, m.Iv, m.Timestamp });

            return Ok(messages);
        }
    }
}
