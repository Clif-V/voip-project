using VoipBackend.Data;
using VoipBackend.Models;
using Microsoft.EntityFrameworkCore;
using SQLitePCL;

namespace VoipBackend.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context;

        public AuthService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Register(string username, string password, string email, string publicKey, string encryptedPrivateKey, string privateKeySalt, string privateKeyIv)
        {
            var exists = await _context.Users.AnyAsync(u => u.Username == username);
            if (exists) return false;

            var user = new User
            {
                Username = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Email = email,
                PublicKey = publicKey,
                EncryptedPrivateKey = encryptedPrivateKey,
                PrivateKeySalt = privateKeySalt,
                PrivateKeyIv = privateKeyIv
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<User?> findUserByUsername(string username)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<User?> findUser(string identifier, string password)
        {
            if (identifier.Contains("@"))
            {
                Console.WriteLine($"Finding user by email: {identifier}");
                return await _context.Users.FirstOrDefaultAsync(u => u.Email == identifier);
            }
            else
            {
                Console.WriteLine($"Finding user by username: {identifier}");
                return await _context.Users.FirstOrDefaultAsync(u => u.Username == identifier);
            }
        }

        public async Task<User?> DeleteByUserName(string username)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
            {
                return null;
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return user;
        }
    }
}