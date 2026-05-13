using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Promotion Repository using Entity Framework Core
    /// </summary>
    public interface IPromotionRepository : IRepository<Promotion>
    {
        Task<Promotion?> GetByCodeAsync(string code);
        Task<List<Promotion>> GetActivePromotionsAsync();
        Task<List<Promotion>> GetPromotionsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<Promotion?> GetWithProductsAsync(int promotionId);
        Task<(List<Promotion> Promotions, int TotalCount)> SearchAsync(
            string? keyword,
            bool? isActive,
            string? discountType,
            decimal? discountValue,
            decimal? minimumOrderAmount,
            int page,
            int pageSize);
    }

    public class PromotionRepository : Repository<Promotion>, IPromotionRepository
    {
        public PromotionRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Promotion?> GetByCodeAsync(string code)
        {
            return await _dbSet
                .FirstOrDefaultAsync(p => p.Code.ToLower() == code.ToLower());
        }

        public async Task<List<Promotion>> GetActivePromotionsAsync()
        {
            var now = DateTime.UtcNow;
            return await _dbSet
                .Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Promotion>> GetPromotionsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _dbSet
                .Where(p => p.StartDate >= startDate && p.EndDate <= endDate)
                .OrderByDescending(p => p.StartDate)
                .ToListAsync();
        }

        public async Task<Promotion?> GetWithProductsAsync(int promotionId)
        {
            return await _dbSet
                .Include(p => p.PromotionProducts)
                .ThenInclude(pp => pp.Product)
                .FirstOrDefaultAsync(p => p.Id == promotionId);
        }

        public async Task<(List<Promotion> Promotions, int TotalCount)> SearchAsync(
            string? keyword,
            bool? isActive,
            string? discountType,
            decimal? discountValue,
            decimal? minimumOrderAmount,
            int page,
            int pageSize)
        {
            var query = _dbSet.AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(p =>
                    p.Code.ToLower().Contains(keyword) ||
                    p.Name.ToLower().Contains(keyword) ||
                    (p.Description != null && p.Description.ToLower().Contains(keyword)));
            }

            if (isActive.HasValue)
            {
                query = query.Where(p => p.IsActive == isActive.Value);
            }

            if (!string.IsNullOrWhiteSpace(discountType))
            {
                query = query.Where(p => p.DiscountType == discountType);
            }

            if (discountValue.HasValue)
            {
                query = query.Where(p => p.DiscountValue == discountValue.Value);
            }

            if (minimumOrderAmount.HasValue)
            {
                query = query.Where(p => p.MinimumOrderAmount == minimumOrderAmount.Value);
            }

            var totalCount = await query.CountAsync();

            var promotions = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (promotions, totalCount);
        }
    }
}
