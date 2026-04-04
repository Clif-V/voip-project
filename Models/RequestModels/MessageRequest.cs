namespace VoipBackend.Models
{
    public class MessageRequest
    {
        public string ToUsername { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Iv { get; set; } = string.Empty; // Initialization Vector for encryption
    }
}