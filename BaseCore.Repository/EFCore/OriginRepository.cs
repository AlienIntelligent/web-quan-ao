using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Origin Repository using Entity Framework Core
    /// </summary>
    public interface IOriginRepository : IRepository<Origin>
    {
        Task<Origin?> GetByNameAsync(string name);
        Task<List<Origin>> GetActiveOriginsAsync();
        Task<Origin?> GetWithProductsAsync(int originId);
        Task<(List<Origin> Origins, int TotalCount)> SearchAsync(string? keyword, bool? isActive, int page, int pageSize);
    }

    public class OriginRepository : Repository<Origin>, IOriginRepository
    {
        public OriginRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Origin?> GetByNameAsync(string name)
        {
            return await _dbSet
                .FirstOrDefaultAsync(o => o.Name.ToLower() == name.ToLower());
        }

        public async Task<List<Origin>> GetActiveOriginsAsync()
        {
            return await _dbSet
                .Where(o => o.IsActive)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<Origin?> GetWithProductsAsync(int originId)
        {
            return await _dbSet
                .Include(o => o.ProductOrigins)
                .ThenInclude(po => po.Product)
                .FirstOrDefaultAsync(o => o.Id == originId);
        }

        public async Task<(List<Origin> Origins, int TotalCount)> SearchAsync(string? keyword, bool? isActive, int page, int pageSize)
        {
            var query = _dbSet.AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(o =>
                    o.Name.ToLower().Contains(keyword) ||
                    (o.Description != null && o.Description.ToLower().Contains(keyword)));
            }

            if (isActive.HasValue)
            {
                query = query.Where(o => o.IsActive == isActive.Value);
            }

            var totalCount = await query.CountAsync();

            var origins = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (origins, totalCount);
        }
    }

    /// <summary>
    /// ProductOrigin Repository using Entity Framework Core
    /// </summary>
    public interface IProductOriginRepository : IRepository<ProductOrigin>
    {
        Task<ProductOrigin?> GetByProductIdAsync(int productId);
        Task<List<ProductOrigin>> GetByOriginIdAsync(int originId);
        Task<ProductOrigin?> GetWithDetailsAsync(int productOriginId);
    }

    public class ProductOriginRepository : Repository<ProductOrigin>, IProductOriginRepository
    {
        public ProductOriginRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<ProductOrigin?> GetByProductIdAsync(int productId)
        {
            return await _dbSet
                .Include(po => po.Product)
                .Include(po => po.Origin)
                .FirstOrDefaultAsync(po => po.ProductId == productId);
        }

        public async Task<List<ProductOrigin>> GetByOriginIdAsync(int originId)
        {
            return await _dbSet
                .Where(po => po.OriginId == originId)
                .Include(po => po.Product)
                .Include(po => po.Origin)
                .ToListAsync();
        }

        public async Task<ProductOrigin?> GetWithDetailsAsync(int productOriginId)
        {
            return await _dbSet
                .Include(po => po.Product)
                .ThenInclude(p => p.Category)
                .Include(po => po.Origin)
                .FirstOrDefaultAsync(po => po.Id == productOriginId);
        }
    }
}
