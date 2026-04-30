using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Shipping Repository using Entity Framework Core
    /// </summary>
    public interface IShippingRepository : IRepository<Shipping>
    {
        Task<Shipping?> GetByOrderIdAsync(int orderId);
        Task<List<Shipping>> GetByStatusAsync(string status);
        Task<List<Shipping>> GetByCarrierAsync(string carrierName);
        Task<List<Shipping>> GetShippingByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<Shipping?> GetByTrackingCodeAsync(string trackingCode);
        Task<(List<Shipping> Shippings, int TotalCount)> SearchAsync(string? status, string? carrierName, int page, int pageSize);
    }

    public class ShippingRepository : Repository<Shipping>, IShippingRepository
    {
        public ShippingRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Shipping?> GetByOrderIdAsync(int orderId)
        {
            return await _dbSet
                .Include(s => s.Order)
                .FirstOrDefaultAsync(s => s.OrderId == orderId);
        }

        public async Task<List<Shipping>> GetByStatusAsync(string status)
        {
            return await _dbSet
                .Where(s => s.ShippingStatus.ToLower() == status.ToLower())
                .Include(s => s.Order)
                .OrderByDescending(s => s.Id)
                .ToListAsync();
        }

        public async Task<List<Shipping>> GetByCarrierAsync(string carrierName)
        {
            return await _dbSet
                .Where(s => s.CarrierName != null && s.CarrierName.ToLower().Contains(carrierName.ToLower()))
                .Include(s => s.Order)
                .OrderByDescending(s => s.Id)
                .ToListAsync();
        }

        public async Task<List<Shipping>> GetShippingByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _dbSet
                .Where(s => s.ShippedDate >= startDate && s.ShippedDate <= endDate)
                .Include(s => s.Order)
                .OrderByDescending(s => s.ShippedDate)
                .ToListAsync();
        }

        public async Task<Shipping?> GetByTrackingCodeAsync(string trackingCode)
        {
            return await _dbSet
                .Include(s => s.Order)
                .FirstOrDefaultAsync(s => s.TrackingCode == trackingCode);
        }

        public async Task<(List<Shipping> Shippings, int TotalCount)> SearchAsync(string? status, string? carrierName, int page, int pageSize)
        {
            var query = _dbSet.Include(s => s.Order).AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(s => s.ShippingStatus.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrEmpty(carrierName))
            {
                query = query.Where(s => s.CarrierName != null && s.CarrierName.ToLower().Contains(carrierName.ToLower()));
            }

            var totalCount = await query.CountAsync();

            var shippings = await query
                .OrderByDescending(s => s.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (shippings, totalCount);
        }
    }
}
