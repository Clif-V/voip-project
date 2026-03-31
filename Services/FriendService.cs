using VoipBackend.Data;
using VoipBackend.Models;
using Microsoft.EntityFrameworkCore;
using Azure.Core;

namespace VoipBackend.Services
{
    public class FriendService
    {
        private readonly AppDbContext _context;

        public FriendService(AppDbContext context)
        {
            _context = context;
        }
        public async Task<object> GetFriendRequestsForUser(string username)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username.ToLower());

            if (user == null) return new { incoming = new List<object>(), outgoing = new List<object>() };

            var incoming = await _context.FriendRequests
                .Where(fr => fr.ToUserId == user.Id)
                .Include(fr => fr.FromUser)
                .Select(fr => new { fr.Id, from = fr.FromUser!.Username })
                .ToListAsync();

            var outgoing = await _context.FriendRequests
                .Where(fr => fr.FromUserId == user.Id)
                .Include(fr => fr.ToUser)
                .Select(fr => new { fr.Id, to = fr.ToUser!.Username })
                .ToListAsync();

            return new { incoming, outgoing };
        }

        public async Task<User?> SendFriendRequestByUsername(string fromUsername, string toUsername)
        {
            Console.Write("fromUsername: " + fromUsername);
            Console.Write("toUsername: " + toUsername);

            var fromUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == fromUsername.ToLower());
            var toUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == toUsername.ToLower());

            Console.WriteLine("fromUser: " + fromUser?.Username + " toUser:" + toUser?.Username);

            if (fromUser == null)
            {
                Console.WriteLine($"SendFriendRequest failed: sender '{fromUsername}' not found in database");
                return null;
            }
            if (toUser == null)
            {
                Console.WriteLine($"SendFriendRequest failed: recipient '{toUsername}' not found in database");
                return null;
            }

            if (fromUser.Id == toUser.Id)
            {
                Console.Write("cannot send friend request to self");

                return null;
            }

            var existingRequest = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.FromUserId == fromUser.Id && fr.ToUserId == toUser.Id);

            if (existingRequest != null)
            {
                Console.WriteLine("Friend request already exists");
                return null;
            }

            var friendRequest = new FriendRequest
            {
                FromUserId = fromUser.Id,
                ToUserId = toUser.Id,
                CreatedAt = DateTime.UtcNow
            };

            _context.FriendRequests.Add(friendRequest);
            await _context.SaveChangesAsync();

            return toUser;
        }

        public async Task<bool> DeleteFriendRequest(string username, int requestId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username.ToLower());
            if (user == null) return false;

            var friendRequest = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.Id == requestId && (fr.FromUserId == user.Id || fr.ToUserId == user.Id));

            if (friendRequest == null) return false;

            _context.FriendRequests.Remove(friendRequest);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<User?> AcceptFriendRequest(string username, int requestId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username.ToLower());

            Console.WriteLine("AcceptFriendRequest called for username: " + username + ", user found: " + (user != null));

            if (user == null) return null;

            var friendRequest = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.Id == requestId && fr.ToUserId == user.Id);

            Console.WriteLine("Friend request found: " + (friendRequest != null));

            if (friendRequest == null) return null;

            var friendship = new Friendship
            {
                User1Id = friendRequest.FromUserId,
                User2Id = friendRequest.ToUserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Friendships.Add(friendship);

            _context.FriendRequests.Remove(friendRequest);
            await _context.SaveChangesAsync();
            Console.WriteLine("Friend request accepted and removed: " + friendRequest.Id);
            return friendRequest.FromUser;
        }

        public async Task<List<string>> GetFriendsForUser(string username)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username.ToLower());
            if (user == null) return new List<string>();

            var friendships = await _context.Friendships
                .Where(f => f.User1Id == user.Id || f.User2Id == user.Id)
                .ToListAsync();

            var friendIds = friendships.Select(f => f.User1Id == user.Id ? f.User2Id : f.User1Id).ToList();

            var friends = await _context.Users
                .Where(u => friendIds.Contains(u.Id))
                .Select(u => u.Username)
                .ToListAsync();

            return friends;
        }

        public async Task<bool> AreFriends(string username1, string username2)
        {
            var user1 = await _context.Users.FirstOrDefaultAsync(u => u.Username == username1.ToLower());
            var user2 = await _context.Users.FirstOrDefaultAsync(u => u.Username == username2.ToLower());

            if (user1 == null || user2 == null) return false;

            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f =>
                    (f.User1Id == user1.Id && f.User2Id == user2.Id) ||
                    (f.User1Id == user2.Id && f.User2Id == user1.Id));

            return friendship != null;
        }
    }
}