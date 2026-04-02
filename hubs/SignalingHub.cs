using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using VoipBackend.Models;
using VoipBackend.Services;

namespace VoipBackend.Hubs;

public class SignalingHub : Hub
{
    private readonly AuthService _authService;

    public SignalingHub(AuthService authService)
    {
        _authService = authService;
    }
    public static ConcurrentDictionary<string, string> users = new();           // username → connectionId
    public static ConcurrentDictionary<string, string> connections = new();     // connectionId → username

    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
    }

    public async Task SendOffer(string roomId, object offer)
    {
        await Clients.OthersInGroup(roomId)
            .SendAsync("ReceiveOffer", offer);
    }

    public async Task SendOfferToUser(string targetUsername, object offer)
    {
        if (users.TryGetValue(targetUsername, out var connectionId))
        {
            var callerUsername = connections[Context.ConnectionId];

            await Clients.Client(connectionId)
                .SendAsync("ReceiveOffer", offer, callerUsername);
        }
    }

    public async Task SendAnswerToUser(string targetUsername, object answer)
    {
        if (users.TryGetValue(targetUsername, out var connectionId))
        {
            await Clients.Client(connectionId)
                .SendAsync("ReceiveAnswer", answer);
        }
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

    public async Task SendIceCandidateToUser(string targetUsername, object candidate)
    {
        if (users.TryGetValue(targetUsername, out var connectionId))
        {
            await Clients.Client(connectionId)
                .SendAsync("ReceiveIceCandidate", candidate);
        }
    }

    public async Task SendMuteState(string targetUsername, bool isMuted)
    {
        var callerUsername = users.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;

        if (users.TryGetValue(targetUsername, out var connectionId))
        {
            await Clients.Client(connectionId)
                .SendAsync("UserMuteChanged", callerUsername, isMuted);
        }
    }

    public async Task BroadcastUserList()
    {
        var userList = users.Keys.ToList();
        await Clients.All.SendAsync("UserListUpdated", userList);
    }

    public override async Task OnConnectedAsync()
    {
        var username = Context.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(username))
        {
            users[username] = Context.ConnectionId;
            connections[Context.ConnectionId] = username;
            await BroadcastUserList();
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var username = Context.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(username))
        {
            users.TryRemove(username, out _);
            connections.TryRemove(Context.ConnectionId, out _);
            await BroadcastUserList();
        }
        await base.OnDisconnectedAsync(exception);
    }

    public Task NotifyCallEnded(string targetUsername)
    {
        if (users.TryGetValue(targetUsername, out var connectionId))
        {
            return Clients.Client(connectionId).SendAsync("CallEnded");
        }
        return Task.CompletedTask;
    }

    public Task RejectCallToUser(string targetUsername)
    {
        if (users.TryGetValue(targetUsername, out var connectionId))
        {
            return Clients.Client(connectionId).SendAsync("CallRejected");
        }
        return Task.CompletedTask;
    }
}