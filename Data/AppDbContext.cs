using Microsoft.EntityFrameworkCore;
using VoipBackend.Models;

namespace VoipBackend.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }
    }
}