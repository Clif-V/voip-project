using Microsoft.AspNetCore.Mvc;
using VoipBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using VoipBackend.Hubs;

namespace VoipBackend.Controllers
{
    [ApiController]
    [Route("message")]
    public class MessageController(AuthService auth, IHubContext<SignalingHub> hubContext) : ControllerBase
    {
        private readonly AuthService _auth = auth;
        private readonly MessageService _messageService;
        private readonly IHubContext<SignalingHub> _hubContext = hubContext;

        [Authorize]
        [HttpPost()]
        public async Task<IActionResult> SendMessage([FromBody] Message input)
        {
            var content = input.Content;
            var senderId = input.SenderId;
            var conversationId = input.ConversationId;

            var message = await _messageService.AddMessage(content, senderId, conversationId);

            if(message == null) return BadRequest("Failed to send message.");

            return Ok(message.Timestamp);
        }
    }
}