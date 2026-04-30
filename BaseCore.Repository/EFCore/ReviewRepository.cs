using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    public interface IReviewRepository : IRepository<Review>
    {
        Task<(List<Review> Items, int TotalCount, double AverageRating)> GetPagedByProductIdAsync(
            int productId,
            int page,
            int pageSize);
    }

    public class ReviewRepository : Repository<Review>, IReviewRepository
    {
        public ReviewRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<(List<Review> Items, int TotalCount, double AverageRating)> GetPagedByProductIdAsync(
            int productId,
            int page,
            int pageSize)
        {
            var query = _dbSet
                .Where(r => r.ProductId == productId);

            var totalCount = await query.CountAsync();

            var averageRating = await query
                .Select(r => (double?)r.Rating)
                .AverageAsync() ?? 0d;

            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount, averageRating);
        }
    }
}

