using Microsoft.AspNetCore.SignalR;

namespace VoipBackend.Hubs;

public class SignalingHub : Hub
{
    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
    }

    public async Task SendOffer(string roomId, object offer)
    {
        await Clients.OthersInGroup(roomId)
            .SendAsync("ReceiveOffer", offer);
    }

    public async Task SendAnswer(string roomId, object answer)
    {
        await Clients.OthersInGroup(roomId)
            .SendAsync("ReceiveAnswer", answer);
    }

    public async Task SendIceCandidate(string roomId, object candidate)
    {
        await Clients.OthersInGroup(roomId)
            .SendAsync("ReceiveIceCandidate", candidate);
    }
}