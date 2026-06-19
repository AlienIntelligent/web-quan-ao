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
        private const int LowStockThreshold = 10;
        private static readonly string[] RevenueExcludedStatuses = { "CANCELLED", "HUY", "RETURNED" };
        private static readonly string[] CancelledStatuses = { "CANCELLED", "HUY" };
        private static readonly string[] PaidPaymentStatuses = { "PAID" };

        private readonly AppDbContext _context;

        public AnalyticsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            var now = DateTime.Now;
            var today = now.Date;
            var tomorrow = today.AddDays(1);
            var monthStart = new DateTime(now.Year, now.Month, 1);
            var nextMonthStart = monthStart.AddMonths(1);
            var previousMonthStart = monthStart.AddMonths(-1);

            var revenueOrders = _context.Orders
                .Where(o =>
                    !RevenueExcludedStatuses.Contains(o.Status.ToUpper()) &&
                    PaidPaymentStatuses.Contains(o.PaymentStatus.ToUpper()));

            var totalRevenue = await revenueOrders
                .SumAsync(o => (decimal?)o.FinalAmount) ?? 0m;
            var revenueToday = await revenueOrders
                .Where(o => o.OrderDate >= today && o.OrderDate < tomorrow)
                .SumAsync(o => (decimal?)o.FinalAmount) ?? 0m;
            var revenueThisMonth = await revenueOrders
                .Where(o => o.OrderDate >= monthStart && o.OrderDate < nextMonthStart)
                .SumAsync(o => (decimal?)o.FinalAmount) ?? 0m;
            var revenueLastMonth = await revenueOrders
                .Where(o => o.OrderDate >= previousMonthStart && o.OrderDate < monthStart)
                .SumAsync(o => (decimal?)o.FinalAmount) ?? 0m;

            var paidOrderCount = await revenueOrders.CountAsync();
            var averageOrderValue = paidOrderCount == 0
                ? 0m
                : Math.Round(totalRevenue / paidOrderCount, 0);

            var growthPercentage = revenueLastMonth == 0
                ? (revenueThisMonth > 0 ? 100m : 0m)
                : Math.Round((revenueThisMonth - revenueLastMonth) * 100 / revenueLastMonth, 1);

            var totalOrders = await _context.Orders.CountAsync();
            var ordersToday = await _context.Orders
                .CountAsync(o => o.OrderDate >= today && o.OrderDate < tomorrow);
            var pendingOrders = await _context.Orders
                .CountAsync(o => o.Status.ToUpper() == "PENDING");
            var processingOrders = await _context.Orders
                .CountAsync(o => o.Status.ToUpper() == "CONFIRMED" || o.Status.ToUpper() == "PROCESSING");
            var shippingOrders = await _context.Orders
                .CountAsync(o => o.Status.ToUpper() == "SHIPPED" || o.Status.ToUpper() == "DELIVERING");
            var deliveredOrders = await _context.Orders
                .CountAsync(o => o.Status.ToUpper() == "DELIVERED");
            var cancelledOrders = await _context.Orders
                .CountAsync(o => CancelledStatuses.Contains(o.Status.ToUpper()));
            var returnedOrders = await _context.Orders
                .CountAsync(o => o.Status.ToUpper() == "RETURNED");

            var totalCustomers = await _context.Users.Where(u => u.UserType == 0).CountAsync(); // Assuming 0 is Customer
            var newCustomersThisMonth = await _context.Users
                .Where(u => u.UserType == 0 && u.Created >= monthStart && u.Created < nextMonthStart)
                .CountAsync();

            var totalProducts = await _context.Products.CountAsync();
            var productIdsWithVariants = _context.ProductVariants.Select(v => v.ProductId).Distinct();
            var variantStock = await _context.ProductVariants.SumAsync(v => (int?)v.Stock) ?? 0;
            var productStock = await _context.Products
                .Where(p => !productIdsWithVariants.Contains(p.Id))
                .SumAsync(p => (int?)p.Stock) ?? 0;
            var totalStock = variantStock + productStock;

            var lowStockWithVariants = await _context.Products
                .Where(p => p.ProductVariants.Any())
                .CountAsync(p =>
                    p.ProductVariants.Sum(v => v.Stock) > 0 &&
                    p.ProductVariants.Sum(v => v.Stock) <= LowStockThreshold);
            var lowStockWithoutVariants = await _context.Products
                .Where(p => !p.ProductVariants.Any())
                .CountAsync(p => p.Stock > 0 && p.Stock <= LowStockThreshold);
            var lowStockProducts = lowStockWithVariants + lowStockWithoutVariants;

            var outOfStockWithVariants = await _context.Products
                .Where(p => p.ProductVariants.Any())
                .CountAsync(p => p.ProductVariants.Sum(v => v.Stock) <= 0);
            var outOfStockWithoutVariants = await _context.Products
                .Where(p => !p.ProductVariants.Any())
                .CountAsync(p => p.Stock <= 0);
            var outOfStockProducts = outOfStockWithVariants + outOfStockWithoutVariants;

            var totalReviews = await _context.Reviews.CountAsync();
            var averageRating = await _context.Reviews
                .AverageAsync(r => (decimal?)r.Rating) ?? 0m;

            return new DashboardStatsDto
            {
                TotalRevenue = totalRevenue,
                RevenueToday = revenueToday,
                RevenueThisMonth = revenueThisMonth,
                RevenueLastMonth = revenueLastMonth,
                TotalOrders = totalOrders,
                OrdersToday = ordersToday,
                PendingOrders = pendingOrders,
                ProcessingOrders = processingOrders,
                ShippingOrders = shippingOrders,
                DeliveredOrders = deliveredOrders,
                CancelledOrders = cancelledOrders,
                ReturnedOrders = returnedOrders,
                TotalCustomers = totalCustomers,
                NewCustomersThisMonth = newCustomersThisMonth,
                TotalProducts = totalProducts,
                TotalStock = totalStock,
                LowStockProducts = lowStockProducts,
                OutOfStockProducts = outOfStockProducts,
                TotalReviews = totalReviews,
                AverageRating = Math.Round(averageRating, 1),
                AverageOrderValue = averageOrderValue,
                GrowthPercentage = growthPercentage
            };
        }

        public async Task<List<RevenueDataDto>> GetRevenueReportAsync(
            DateTime startDate,
            DateTime endDate,
            string groupBy = "day")
        {
            var start = startDate.Date;
            var endExclusive = endDate.Date.AddDays(1);

            var query = _context.Orders.Where(o =>
                o.OrderDate >= start &&
                o.OrderDate < endExclusive &&
                !RevenueExcludedStatuses.Contains(o.Status.ToUpper()) &&
                PaidPaymentStatuses.Contains(o.PaymentStatus.ToUpper()));

            if (groupBy == "month")
            {
                var data = await query
                    .GroupBy(o => new { o.OrderDate.Year, o.OrderDate.Month })
                    .Select(g => new
                    {
                        g.Key.Year,
                        g.Key.Month,
                        Revenue = g.Sum(o => o.FinalAmount),
                        Orders = g.Count()
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToListAsync();

                return data.Select(x => new RevenueDataDto
                {
                    Date = $"{x.Year:D4}-{x.Month:D2}",
                    Revenue = x.Revenue,
                    Orders = x.Orders
                }).ToList();
            }

            if (groupBy == "year")
            {
                var data = await query
                    .GroupBy(o => o.OrderDate.Year)
                    .Select(g => new
                    {
                        Year = g.Key,
                        Revenue = g.Sum(o => o.FinalAmount),
                        Orders = g.Count()
                    })
                    .OrderBy(x => x.Year)
                    .ToListAsync();

                return data.Select(x => new RevenueDataDto
                {
                    Date = x.Year.ToString(),
                    Revenue = x.Revenue,
                    Orders = x.Orders
                }).ToList();
            }

            var daily = await query
                .GroupBy(o => o.OrderDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => o.FinalAmount),
                    Orders = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            return daily.Select(x => new RevenueDataDto
            {
                Date = x.Date.ToString("yyyy-MM-dd"),
                Revenue = x.Revenue,
                Orders = x.Orders
            }).ToList();
        }

        public async Task<List<BestSellerDto>> GetBestSellersAsync(int top = 5)
        {
            var bestSellers = await _context.OrderDetails
                .Where(od =>
                    !RevenueExcludedStatuses.Contains(od.Order.Status.ToUpper()) &&
                    PaidPaymentStatuses.Contains(od.Order.PaymentStatus.ToUpper()))
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
