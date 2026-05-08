using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly AppDbContext _context;

        public AnalyticsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            var totalRevenue = await _context.Orders
                .Where(o => o.Status != "HUY" && o.Status != "Cancelled")
                .SumAsync(o => o.TotalAmount);

            var totalOrders = await _context.Orders.CountAsync();
            var totalCustomers = await _context.Users.Where(u => u.UserType == 0).CountAsync(); // Assuming 0 is Customer
            var totalProducts = await _context.Products.CountAsync();

            return new DashboardStatsDto
            {
                TotalRevenue = totalRevenue,
                TotalOrders = totalOrders,
                TotalCustomers = totalCustomers,
                TotalProducts = totalProducts,
                GrowthPercentage = 15.5m // Placeholder for logic
            };
        }

        public async Task<List<RevenueDataDto>> GetRevenueReportAsync(DateTime startDate, DateTime endDate)
        {
            var data = await _context.Orders
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate && o.Status != "HUY" && o.Status != "Cancelled")
                .GroupBy(o => o.OrderDate.Date)
                .Select(g => new RevenueDataDto
                {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    Revenue = g.Sum(o => o.TotalAmount),
                    Orders = g.Count()
                })
                .OrderBy(r => r.Date)
                .ToListAsync();

            return data;
        }

        public async Task<List<BestSellerDto>> GetBestSellersAsync(int top = 5)
        {
            var bestSellers = await _context.OrderDetails
                .GroupBy(od => new { od.ProductId, od.Product.Name })
                .Select(g => new BestSellerDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    TotalSold = g.Sum(od => od.Quantity),
                    TotalRevenue = g.Sum(od => od.Quantity * od.UnitPrice)
                })
                .OrderByDescending(b => b.TotalSold)
                .Take(top)
                .ToListAsync();

            return bestSellers;
        }
    }
}
