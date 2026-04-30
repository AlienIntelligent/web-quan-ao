using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    public interface IProductVariantRepository : IRepository<ProductVariant>
    {
        Task<List<ProductVariant>> GetByProductIdAsync(int productId);
    }

    public class ProductVariantRepository : Repository<ProductVariant>, IProductVariantRepository
    {
        public ProductVariantRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<ProductVariant>> GetByProductIdAsync(int productId)
        {
            return await _dbSet
                .Where(v => v.ProductId == productId)
                .OrderBy(v => v.Id)
                .ToListAsync();
        }
    }
}

