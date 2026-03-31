using Microsoft.AspNetCore.Mvc;
using VoipBackend.Services;
using VoipBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using VoipBackend.Hubs;


namespace VoipProject.Controllers;
[ApiController]
[Route("friend")]
public class FriendController(FriendService friendService, IHubContext<SignalingHub> hubContext) : ControllerBase
{
    private readonly FriendService _friendService = friendService;
    private readonly IHubContext<SignalingHub> _hubContext = hubContext;
        
    [Authorize]
    [HttpPost("request")]
    public async Task<IActionResult> SendFriendRequest([FromBody] FriendRequestDto input)
    {
        var fromUsername = User.Identity?.Name;
        if (string.IsNullOrEmpty(fromUsername))
            return Unauthorized();

        Console.WriteLine("From: " + fromUsername + ", To: " + input.ToUsername);

        var result = await _friendService.SendFriendRequestByUsername(fromUsername, input.ToUsername);

        Console.WriteLine("Result: " + result);

        if (await _friendService.AreFriends(fromUsername, input.ToUsername) || await _friendService.AreFriends(input.ToUsername, fromUsername))
            return BadRequest("You are already friends.");

        if (result == null)
            return BadRequest("Unable to send friend request.");

        if (SignalingHub.users.TryGetValue(input.ToUsername, out var connectionId))
        {
            var friendRequests = await _friendService.GetFriendRequestsForUser(input.ToUsername);
            await _hubContext.Clients.Client(connectionId)
                .SendAsync("FriendRequestListUpdated", friendRequests);
        }

        return Ok(new { username = result.Username });
    }

    [Authorize]
    [HttpGet("requests")]
    public async Task<IActionResult> GetFriendRequests()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        var friendRequests = await _friendService.GetFriendRequestsForUser(username);
        return Ok(friendRequests);
    }

    [Authorize]
    [HttpDelete("request/{requestId}/reject")]
    public async Task<IActionResult> DeleteFriendRequest(int requestId)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        var result = await _friendService.DeleteFriendRequest(username, requestId);
        if (!result)
            return BadRequest("Unable to delete friend request.");

        return Ok();
    }

    [Authorize]
    [HttpPost("request/{requestId}/accept")]
    public async Task<IActionResult> AcceptFriendRequest(int requestId) 
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        var result = await _friendService.AcceptFriendRequest(username, requestId);
        if (result == null)
            return BadRequest("Unable to accept friend request.");

        return Ok(new { username = result.Username });
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetFriends()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        var friends = await _friendService.GetFriendsForUser(username);
        return Ok(friends);
    }

    [Authorize]
    [HttpDelete("{username}")]
    public async Task<IActionResult> RemoveFriend(string username)
    {
        var currentUsername = User.Identity?.Name;
        if (string.IsNullOrEmpty(currentUsername))
            return Unauthorized();

        var result = await _friendService.RemoveFriendship(currentUsername, username);
        if (!result)
            return BadRequest("Unable to remove friend.");

        return NoContent();
    }
}