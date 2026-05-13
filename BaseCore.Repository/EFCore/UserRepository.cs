using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// User Repository using Entity Framework Core
    /// </summary>
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByUsernameAsync(string username);
        Task<(List<User> Users, int TotalCount)> SearchAsync(
            string? keyword,
            string? phone,
            int? userType,
            bool? isActive,
            int page,
            int pageSize);
        // Map AddAsync to CreateAsync if service expects CreateAsync
        Task<User> CreateAsync(User user);
    }

    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<User> CreateAsync(User user)
        {
            return await AddAsync(user);
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.UserName == username);
        }

        public async Task<(List<User> Users, int TotalCount)> SearchAsync(
            string? keyword,
            string? phone,
            int? userType,
            bool? isActive,
            int page,
            int pageSize)
        {
            var query = _dbSet.AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(u =>
                    u.UserName.ToLower().Contains(keyword) ||
                    u.Name.ToLower().Contains(keyword) ||
                    u.Phone.ToLower().Contains(keyword) ||
                    (u.Email != null && u.Email.ToLower().Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(phone))
            {
                var phoneKeyword = phone.ToLower();
                query = query.Where(u => u.Phone.ToLower().Contains(phoneKeyword));
            }

            if (userType.HasValue)
            {
                query = query.Where(u => u.UserType == userType.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(u => u.IsActive == isActive.Value);
            }

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.Created)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (users, totalCount);
        }
    }
}


