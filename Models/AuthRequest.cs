namespace VoipBackend.Models
{
    public class AuthRequest
    {
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string Email { get; set; }
    }
}