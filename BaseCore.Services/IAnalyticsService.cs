using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public interface IAnalyticsService
    {
        Task<DashboardStatsDto> GetDashboardStatsAsync();
        Task<List<RevenueDataDto>> GetRevenueReportAsync(DateTime startDate, DateTime endDate);
        Task<List<BestSellerDto>> GetBestSellersAsync(int top = 5);
    }

    public class DashboardStatsDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int TotalCustomers { get; set; }
        public int TotalProducts { get; set; }
        public decimal GrowthPercentage { get; set; }
    }

    public class RevenueDataDto
    {
        public string Date { get; set; }
        public decimal Revenue { get; set; }
        public int Orders { get; set; }
    }

    public class BestSellerDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int TotalSold { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}
