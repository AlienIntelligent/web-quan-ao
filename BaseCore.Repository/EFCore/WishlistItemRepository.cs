using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Repository.EFCore
{
    public interface IWishlistItemRepository : IRepository<WishlistItem>
    {
        Task<List<WishlistItem>> GetByUserIdAsync(string userId);
        Task<WishlistItem?> GetByUserProductAndVariantAsync(string userId, int productId, int? variantId);
        Task<int> GetWishlistItemCountAsync(string userId);
        Task ClearWishlistAsync(string userId);
    }

    public class WishlistItemRepository : Repository<WishlistItem>, IWishlistItemRepository
    {
        public WishlistItemRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<WishlistItem>> GetByUserIdAsync(string userId)
        {
            return await _dbSet
                .Where(w => w.UserId == userId)
                .Include(w => w.Product)
                .Include(w => w.ProductVariant)
                    .ThenInclude(v => v.SizeNavigation)
                .Include(w => w.ProductVariant)
                    .ThenInclude(v => v.ColorNavigation)
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();
        }

        public async Task<WishlistItem?> GetByUserProductAndVariantAsync(string userId, int productId, int? variantId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId && w.VariantId == variantId);
        }

        public async Task<int> GetWishlistItemCountAsync(string userId)
        {
            return await _dbSet
                .CountAsync(w => w.UserId == userId);
        }

        public async Task ClearWishlistAsync(string userId)
        {
            var items = await _dbSet.Where(w => w.UserId == userId).ToListAsync();
            if (items.Any())
            {
                _dbSet.RemoveRange(items);
                await _context.SaveChangesAsync();
            }
        }
    }
}
