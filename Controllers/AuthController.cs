using Microsoft.AspNetCore.Mvc;
using VoipBackend.Services;
using VoipBackend.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using VoipBackend.Hubs;

namespace VoipBackend.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController(AuthService auth, IHubContext<SignalingHub> hubContext) : ControllerBase
    {
        private readonly AuthService _auth = auth;
        private readonly IHubContext<SignalingHub> _hubContext = hubContext;

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthRequestRegister input)
        {

            if (input.Username.Contains("@"))
            {
                return BadRequest("Username cannot contain '@'.");
            }

            var success = await _auth.Register(input.Username, input.Password, input.Email, input.PublicKey, input.EncryptedPrivateKey, input.PrivateKeySalt, input.PrivateKeyIv);

            if (!success)
                return BadRequest("User already exists");

            return Ok();
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthRequestLogin input)
        {
            var user = await _auth.findUser(input.Identifier, input.Password);

            if (user == null)
            {
                return Unauthorized("Incorrect username/email.");
            }

            if (!BCrypt.Net.BCrypt.Verify(input.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid password.");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SUPERS_SECRET_PLACEHOLDER_KEY_CHANGE_LATER_PLEASE"));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                token = jwt,
                username = user.Username,
                email = user.Email
            });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username))
                return Unauthorized();

            var user = await _auth.findUserByUsername(username);
            if (user == null)
                return Unauthorized("User no longer exists.");

            return Ok(new { username = user.Username, email = user.Email });
        }


        [HttpGet("keypair/{username}")]
        public async Task<IActionResult> GetKeypair(string username)
        {
            var user = await _auth.findUserByUsername(username);
            if (user == null) return NotFound();

            return Ok(new
            {
                encryptedPrivateKey = user.EncryptedPrivateKey,
                privateKeySalt = user.PrivateKeySalt,
                privateKeyIv = user.PrivateKeyIv
            });
        }

        [Authorize]
        [HttpDelete("delete")]
        public async Task<IActionResult> Delete()
        {
            var username = User.Identity?.Name;

            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized("User identity not found.");
            }

            var user = await _auth.DeleteByUserName(username);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            return NoContent();
        }
    }
}