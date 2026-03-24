using Microsoft.AspNetCore.Mvc;
using VoipBackend.Data;
using VoipBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace VoipBackend.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User input)
        {
            var exists = await _context.Users
                .AnyAsync(u => u.Username == input.Username);

            if (exists)
                return BadRequest("User already exists");

            var user = new User
            {
                Username = input.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(input.PasswordHash)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registered" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User input)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == input.Username);

            if (user == null)
                return Unauthorized("Invalid username");

            if (!BCrypt.Net.BCrypt.Verify(input.PasswordHash, user.PasswordHash))
                return Unauthorized("Invalid password");

            return Ok(new { username = user.Username });
        }
    }
}