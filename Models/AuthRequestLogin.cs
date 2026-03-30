namespace VoipBackend.Models
{
    public class AuthRequestLogin
    {
        public string Identifier { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}