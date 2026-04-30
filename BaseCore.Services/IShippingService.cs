using BaseCore.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public interface IShippingService
    {
        Task<List<Shipping>> GetAllShippingsAsync();
        Task<Shipping> GetShippingByIdAsync(int id);
        Task<Shipping> GetShippingByOrderIdAsync(int orderId);
        Task<List<Shipping>> GetShippingByStatusAsync(string status);
        Task<List<Shipping>> GetShippingByCarrierAsync(string carrierName);
        Task<List<Shipping>> GetShippingByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<Shipping> GetShippingByTrackingCodeAsync(string trackingCode);
        Task<Shipping> CreateShippingAsync(Shipping shipping);
        Task UpdateShippingAsync(Shipping shipping);
        Task DeleteShippingAsync(int id);
        Task<(List<Shipping> Shippings, int TotalCount)> SearchAsync(string? status, string? carrierName, int page, int pageSize);
        Task UpdateShippingStatusAsync(int shippingId, string newStatus);
    }
}
