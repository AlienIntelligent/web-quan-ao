using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Product Repository using Entity Framework Core
    /// </summary>
    public interface IProductRepository : IRepository<Product>
    {
        Task<(List<Product> Products, int TotalCount)> SearchAsync(
            string? keyword,
            int? categoryId,
            decimal? minPrice,
            decimal? maxPrice,
            int? sizeId,
            int? colorId,
            string? sortBy,
            int page,
            int pageSize);
        Task<Dictionary<int, int>> GetSoldCountsAsync(IEnumerable<int> productIds);
        Task<List<Product>> GetByCategoryAsync(int categoryId);
    }

    public class ProductRepository : Repository<Product>, IProductRepository
    {
        public ProductRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<(List<Product> Products, int TotalCount)> SearchAsync(
            string? keyword,
            int? categoryId,
            decimal? minPrice,
            decimal? maxPrice,
            int? sizeId,
            int? colorId,
            string? sortBy,
            int page,
            int pageSize)
        {
            var query = _dbSet
                .Include(p => p.Category)
                .Include(p => p.ProductOrigin)
                    .ThenInclude(po => po.Origin)
                .Include(p => p.ProductVariants)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var terms = keyword
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                foreach (var term in terms)
                {
                    var searchTerm = term;
                    query = query.Where(p => p.Name.Contains(searchTerm));
                }
            }

            if (categoryId.HasValue && categoryId > 0)
            {
                query = query.Where(p => p.CategoryId == categoryId);
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            if (sizeId.HasValue && colorId.HasValue)
            {
                query = query.Where(p => p.ProductVariants.Any(v =>
                    v.SizeId == sizeId.Value &&
                    v.ColorId == colorId.Value));
            }
            else if (sizeId.HasValue)
            {
                query = query.Where(p => p.ProductVariants.Any(v => v.SizeId == sizeId.Value));
            }
            else if (colorId.HasValue)
            {
                query = query.Where(p => p.ProductVariants.Any(v => v.ColorId == colorId.Value));
            }

            var totalCount = await query.CountAsync();

            query = (sortBy ?? "newest").Trim().ToLowerInvariant() switch
            {
                "price-asc" or "lowtohigh" => query.OrderBy(p => p.Price),
                "price-desc" or "hightolow" => query.OrderByDescending(p => p.Price),
                "sales" or "popular" => query.OrderByDescending(p =>
                    p.OrderDetails
                        .Where(od => od.Order.Status != "CANCELLED" && od.Order.Status != "RETURNED")
                        .Sum(od => (int?)od.Quantity) ?? 0),
                _ => query.OrderByDescending(p => p.Id)
            };

            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (products, totalCount);
        }

        public async Task<Dictionary<int, int>> GetSoldCountsAsync(IEnumerable<int> productIds)
        {
            var ids = productIds.Distinct().ToList();
            if (ids.Count == 0) return new Dictionary<int, int>();

            return await _context.Set<OrderDetail>()
                .Where(od =>
                    ids.Contains(od.ProductId) &&
                    od.Order.Status != "CANCELLED" &&
                    od.Order.Status != "RETURNED")
                .GroupBy(od => od.ProductId)
                .Select(group => new
                {
                    ProductId = group.Key,
                    SoldCount = group.Sum(detail => detail.Quantity)
                })
                .ToDictionaryAsync(item => item.ProductId, item => item.SoldCount);
        }

        public async Task<List<Product>> GetByCategoryAsync(int categoryId)
        {
            return await _dbSet
                .Where(p => p.CategoryId == categoryId)
                .Include(p => p.Category)
                .ToListAsync();
        }
    }
}
