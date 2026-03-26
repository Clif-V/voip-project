using Microsoft.AspNetCore.Mvc;
using VoipBackend.Services;
using VoipBackend.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Authorization;

namespace VoipBackend.Controllers
{
    [ApiController]
    [Route("auth")]
    [Route("users")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _auth;

        public AuthController(AuthService auth)
        {
            _auth = auth;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthRequest input)
        {
            var success = await _auth.Register(input.Username, input.PasswordHash, input.Email);

            if (!success)
                return BadRequest("User already exists");

            return Ok();
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthRequest input)
        {
            var user = await _auth.Login(input.Username, input.PasswordHash);

            if (user == null)
            {
                return Unauthorized("No valid user.");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SUPERS_SECRET_PLACEHOLDER_KEY_CHANGE_LATER_PLEASE"));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username)
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
                username = user.Username
            });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var username = User.Identity?.Name;

            return Ok(new {username});
        }
    }
}