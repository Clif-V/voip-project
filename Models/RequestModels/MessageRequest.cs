namespace VoipBackend.Models
{
    public class MessageRequest
    {
        public string Token { get; set; } = string.Empty;
        public string ToUsername { get; set; } = string.Empty; // used for SignalR routing only, never persisted
        public string Message { get; set; } = string.Empty;
        public string Iv { get; set; } = string.Empty;
    }
}