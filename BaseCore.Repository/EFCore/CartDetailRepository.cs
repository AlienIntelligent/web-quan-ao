using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// CartDetail Repository using Entity Framework Core
    /// </summary>
    public interface ICartDetailRepository : IRepository<CartDetail>
    {
        Task<List<CartDetail>> GetByUserIdAsync(string userId);
        Task<CartDetail?> GetByUserProductAndVariantAsync(string userId, int productId, int? variantId);
        Task<decimal> GetCartTotalAsync(string userId);
        Task<int> GetCartItemCountAsync(string userId);
        Task ClearCartAsync(string userId);
        Task<(List<CartDetail> Items, decimal Total, int ItemCount)> GetCartWithDetailsAsync(string userId);
    }

    public class CartDetailRepository : Repository<CartDetail>, ICartDetailRepository
    {
        public CartDetailRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<CartDetail>> GetByUserIdAsync(string userId)
        {
            return await _dbSet
                .Where(c => c.UserId == userId)
                .Include(c => c.Product)
                .Include(c => c.ProductVariant)
                    .ThenInclude(v => v.SizeNavigation)
                .Include(c => c.ProductVariant)
                    .ThenInclude(v => v.ColorNavigation)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<CartDetail?> GetByUserProductAndVariantAsync(string userId, int productId, int? variantId)
        {
            return await _dbSet
                .Include(c => c.Product)
                .Include(c => c.ProductVariant)
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId && c.VariantId == variantId);
        }

        public async Task<decimal> GetCartTotalAsync(string userId)
        {
            return await _dbSet
                .Where(c => c.UserId == userId)
                .SumAsync(c => c.UnitPrice * c.Quantity);
        }

        public async Task<int> GetCartItemCountAsync(string userId)
        {
            return await _dbSet
                .Where(c => c.UserId == userId)
                .SumAsync(c => c.Quantity);
        }

        public async Task ClearCartAsync(string userId)
        {
            var cartItems = await _dbSet.Where(c => c.UserId == userId).ToListAsync();
            if (cartItems.Any())
            {
                _dbSet.RemoveRange(cartItems);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<(List<CartDetail> Items, decimal Total, int ItemCount)> GetCartWithDetailsAsync(string userId)
        {
            var items = await GetByUserIdAsync(userId);
            var total = await GetCartTotalAsync(userId);
            var itemCount = await GetCartItemCountAsync(userId);

            return (items, total, itemCount);
        }
    }
}
