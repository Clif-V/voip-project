using Microsoft.AspNetCore.Mvc;
using VoipBackend.Services;

namespace VoipBackend.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _auth;

        public AuthController(AuthService auth)
        {
            _auth = auth;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] dynamic input)
        {
            var success = await _auth.Register(
                (string)input.username,
                (string)input.passwordHash
            );

            if (!success)
                return BadRequest("User already exists");

            return Ok();
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] dynamic input)
        {
            var user = await _auth.Login(
                (string)input.username,
                (string)input.passwordHash
            );

            if (user == null)
                return Unauthorized();

            return Ok(new { username = user.Username });
        }
    }
}