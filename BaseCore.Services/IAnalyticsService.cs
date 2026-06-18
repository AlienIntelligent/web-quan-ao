using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public interface IAnalyticsService
    {
        Task<DashboardStatsDto> GetDashboardStatsAsync();
        Task<List<RevenueDataDto>> GetRevenueReportAsync(
            DateTime startDate,
            DateTime endDate,
            string groupBy = "day");
        Task<List<BestSellerDto>> GetBestSellersAsync(int top = 5);
    }

    public class DashboardStatsDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal RevenueToday { get; set; }
        public decimal RevenueThisMonth { get; set; }
        public decimal RevenueLastMonth { get; set; }
        public int TotalOrders { get; set; }
        public int OrdersToday { get; set; }
        public int PendingOrders { get; set; }
        public int ProcessingOrders { get; set; }
        public int ShippingOrders { get; set; }
        public int DeliveredOrders { get; set; }
        public int CancelledOrders { get; set; }
        public int ReturnedOrders { get; set; }
        public int TotalCustomers { get; set; }
        public int NewCustomersThisMonth { get; set; }
        public int TotalProducts { get; set; }
        public int TotalStock { get; set; }
        public int LowStockProducts { get; set; }
        public int OutOfStockProducts { get; set; }
        public int TotalReviews { get; set; }
        public decimal AverageRating { get; set; }
        public decimal AverageOrderValue { get; set; }
        public decimal GrowthPercentage { get; set; }
    }

    public class RevenueDataDto
    {
        public string Date { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int Orders { get; set; }
    }

    public class BestSellerDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int TotalSold { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}
