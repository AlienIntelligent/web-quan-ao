using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Order Repository using Entity Framework Core
    /// </summary>
    public interface IOrderRepository : IRepository<Order>
    {
        Task<List<Order>> GetByUserAsync(string userId);
        Task<Order?> GetWithDetailsAsync(int orderId);
        Task<(List<Order> Orders, int TotalCount)> SearchAllAsync(
            string? keyword,
            string? status,
            DateTime? fromDate,
            decimal? finalAmount,
            int page,
            int pageSize);
    }

    public class OrderRepository : Repository<Order>, IOrderRepository
    {
        public OrderRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<Order>> GetByUserAsync(string userId)
        {
            return await _dbSet
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderDetailOrders)
                    .ThenInclude(od => od.Product)
                .Include(o => o.OrderDetailOrders)
                    .ThenInclude(od => od.ProductVariant)
                        .ThenInclude(v => v.SizeNavigation)
                .Include(o => o.OrderDetailOrders)
                    .ThenInclude(od => od.ProductVariant)
                        .ThenInclude(v => v.ColorNavigation)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order?> GetWithDetailsAsync(int orderId)
        {
            return await _dbSet
                .Include(o => o.OrderDetailOrders)
                    .ThenInclude(od => od.Product)
                .Include(o => o.OrderDetailOrders)
                    .ThenInclude(od => od.ProductVariant)
                        .ThenInclude(v => v.SizeNavigation)
                .Include(o => o.OrderDetailOrders)
                    .ThenInclude(od => od.ProductVariant)
                        .ThenInclude(v => v.ColorNavigation)
                .Include(o => o.OrderPromotions)
                    .ThenInclude(op => op.Promotion)
                .Include(o => o.Shipping)
                .FirstOrDefaultAsync(o => o.Id == orderId);
        }

        public async Task<(List<Order> Orders, int TotalCount)> SearchAllAsync(
            string? keyword,
            string? status,
            DateTime? fromDate,
            decimal? finalAmount,
            int page,
            int pageSize)
        {
            var query = _dbSet
                .Include(o => o.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var lowerKeyword = keyword.ToLower();
                query = query.Where(o =>
                    o.UserId.ToLower().Contains(lowerKeyword) ||
                    o.User.Name.ToLower().Contains(lowerKeyword) ||
                    o.User.UserName.ToLower().Contains(lowerKeyword) ||
                    o.User.Email.ToLower().Contains(lowerKeyword) ||
                    o.Id.ToString().Contains(lowerKeyword) ||
                    o.OrderCode.ToLower().Contains(lowerKeyword));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(o => o.Status == status);
            }

            if (fromDate.HasValue)
            {
                var start = fromDate.Value.Date;
                query = query.Where(o => o.OrderDate >= start);
            }

            if (finalAmount.HasValue)
            {
                query = query.Where(o => o.FinalAmount == finalAmount.Value);
            }

            var totalCount = await query.CountAsync();
            var orders = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (orders, totalCount);
        }
    }

    /// <summary>
    /// OrderDetail Repository using Entity Framework Core
    /// </summary>
    public interface IOrderDetailRepository : IRepository<OrderDetail>
    {
        Task<List<OrderDetail>> GetByOrderAsync(int orderId);
    }

    public class OrderDetailRepository : Repository<OrderDetail>, IOrderDetailRepository
    {
        public OrderDetailRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<OrderDetail>> GetByOrderAsync(int orderId)
        {
            return await _dbSet
                .Where(od => od.OrderId == orderId)
                .Include(od => od.Product)
                .Include(od => od.ProductVariant)
                    .ThenInclude(v => v.SizeNavigation)
                .Include(od => od.ProductVariant)
                    .ThenInclude(v => v.ColorNavigation)
                .ToListAsync();
        }
    }
}
