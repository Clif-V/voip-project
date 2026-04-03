using System.ComponentModel.DataAnnotations;

namespace VoipBackend.Models
{
    public class AuthRequestRegister
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        [MaxLength(128)]
        [MinLength(124)]
        public string PublicKey { get; set; } = string.Empty;

        public string EncryptedPrivateKey { get; set; } = string.Empty;
        public string PrivateKeySalt { get; set; } = string.Empty;
        public string PrivateKeyIv { get; set; } = string.Empty;
    }
}