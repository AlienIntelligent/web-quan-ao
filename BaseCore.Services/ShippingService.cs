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
    public class ShippingService : IShippingService
    {
        private static readonly HashSet<string> AllowedShippingStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "WAITING",
            "PICKED_UP",
            "SHIPPING",
            "DELIVERED",
            "FAILED",
            "CANCELLED"
        };

        private static readonly IReadOnlyDictionary<string, string> ShippingToOrderStatuses =
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["PICKED_UP"] = "SHIPPED",
                ["SHIPPING"] = "DELIVERING",
                ["DELIVERED"] = "DELIVERED",
                ["FAILED"] = "RETURNED"
            };

        private readonly IShippingRepository _shippingRepository;
        private readonly AppDbContext _context;

        public ShippingService(IShippingRepository shippingRepository, AppDbContext context)
        {
            _shippingRepository = shippingRepository;
            _context = context;
        }

        public async Task<List<Shipping>> GetAllShippingsAsync()
        {
            var shippings = await _shippingRepository.GetAllAsync();
            return shippings.ToList();
        }

        public async Task<Shipping> GetShippingByIdAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid shipping ID", nameof(id));

            var shipping = await _shippingRepository.GetByIdAsync(id);
            if (shipping == null)
                throw new InvalidOperationException($"Shipping with ID {id} not found");

            return shipping;
        }

        public async Task<Shipping> GetShippingByOrderIdAsync(int orderId)
        {
            if (orderId <= 0)
                throw new ArgumentException("Invalid order ID", nameof(orderId));

            var shipping = await _shippingRepository.GetByOrderIdAsync(orderId);
            if (shipping == null)
                throw new InvalidOperationException($"Shipping for order {orderId} not found");

            return shipping;
        }

        public async Task<List<Shipping>> GetShippingByStatusAsync(string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                throw new ArgumentException("Status cannot be empty", nameof(status));

            var shippings = await _shippingRepository.GetByStatusAsync(status);
            return shippings;
        }

        public async Task<List<Shipping>> GetShippingByCarrierAsync(string carrierName)
        {
            if (string.IsNullOrWhiteSpace(carrierName))
                throw new ArgumentException("Carrier name cannot be empty", nameof(carrierName));

            var shippings = await _shippingRepository.GetByCarrierAsync(carrierName);
            return shippings;
        }

        public async Task<List<Shipping>> GetShippingByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            if (startDate > endDate)
                throw new ArgumentException("Start date must be before end date");

            var shippings = await _shippingRepository.GetShippingByDateRangeAsync(startDate, endDate);
            return shippings;
        }

        public async Task<Shipping> GetShippingByTrackingCodeAsync(string trackingCode)
        {
            if (string.IsNullOrWhiteSpace(trackingCode))
                throw new ArgumentException("Tracking code cannot be empty", nameof(trackingCode));

            var shipping = await _shippingRepository.GetByTrackingCodeAsync(trackingCode);
            if (shipping == null)
                throw new InvalidOperationException($"Shipping with tracking code '{trackingCode}' not found");

            return shipping;
        }

        public async Task<Shipping> CreateShippingAsync(Shipping shipping)
        {
            if (shipping == null)
                throw new ArgumentNullException(nameof(shipping));

            if (shipping.OrderId <= 0)
                throw new ArgumentException("Valid order ID is required", nameof(shipping.OrderId));

            if (string.IsNullOrWhiteSpace(shipping.ReceiverName))
                throw new ArgumentException("Receiver name is required", nameof(shipping.ReceiverName));

            if (string.IsNullOrWhiteSpace(shipping.ShippingAddress))
                throw new ArgumentException("Shipping address is required", nameof(shipping.ShippingAddress));

            var order = await _context.Set<Order>().FirstOrDefaultAsync(o => o.Id == shipping.OrderId);
            if (order == null)
                throw new InvalidOperationException($"Order with ID {shipping.OrderId} not found");

            // Fallback phone number from ShippingAddress if not provided
            if (string.IsNullOrWhiteSpace(shipping.ReceiverPhone))
            {
                // Format: "Name - Phone - Address - ..."
                var parts = order.ShippingAddress.Split(" - ", StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length > 1)
                {
                    shipping.ReceiverPhone = parts[1].Trim();
                }
            }

            shipping.ShippingStatus = NormalizeShippingStatus(shipping.ShippingStatus);
            ApplyStatusDates(shipping);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var created = await _shippingRepository.AddAsync(shipping);
                await SyncOrderDeliveryStatusAsync(created.OrderId, created.ShippingStatus);
                await transaction.CommitAsync();
                return created;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task UpdateShippingAsync(Shipping shipping)
        {
            if (shipping == null)
                throw new ArgumentNullException(nameof(shipping));

            if (shipping.Id <= 0)
                throw new ArgumentException("Invalid shipping ID", nameof(shipping.Id));

            var existingShipping = await _shippingRepository.GetByIdAsync(shipping.Id);
            if (existingShipping == null)
                throw new InvalidOperationException($"Shipping with ID {shipping.Id} not found");
            _context.Entry(existingShipping).State = EntityState.Detached;

            await EnsureOrderExistsAsync(shipping.OrderId);
            shipping.ShippingStatus = NormalizeShippingStatus(shipping.ShippingStatus);
            ApplyStatusDates(shipping);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await _shippingRepository.UpdateAsync(shipping);
                await SyncOrderDeliveryStatusAsync(shipping.OrderId, shipping.ShippingStatus);
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task DeleteShippingAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid shipping ID", nameof(id));

            var shipping = await _shippingRepository.GetByIdAsync(id);
            if (shipping == null)
                throw new InvalidOperationException($"Shipping with ID {id} not found");

            await _shippingRepository.DeleteByIdAsync(id);
        }

        public async Task<(List<Shipping> Shippings, int TotalCount)> SearchAsync(string? status, string? carrierName, string? keyword, int page, int pageSize)
        {
            if (page < 1)
                throw new ArgumentException("Page number must be greater than 0", nameof(page));

            if (pageSize < 1 || pageSize > 100)
                throw new ArgumentException("Page size must be between 1 and 100", nameof(pageSize));

            var result = await _shippingRepository.SearchAsync(status, carrierName, keyword, page, pageSize);
            return result;
        }

        public async Task UpdateShippingStatusAsync(int shippingId, string newStatus)
        {
            if (shippingId <= 0)
                throw new ArgumentException("Invalid shipping ID", nameof(shippingId));

            if (string.IsNullOrWhiteSpace(newStatus))
                throw new ArgumentException("Status cannot be empty", nameof(newStatus));

            var shipping = await _shippingRepository.GetByIdAsync(shippingId);
            if (shipping == null)
                throw new InvalidOperationException($"Shipping with ID {shippingId} not found");

            shipping.ShippingStatus = NormalizeShippingStatus(newStatus);
            ApplyStatusDates(shipping);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await _shippingRepository.UpdateAsync(shipping);
                await SyncOrderDeliveryStatusAsync(shipping.OrderId, shipping.ShippingStatus);
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<Shipping> ConfirmShipmentAsync(int shippingId)
        {
            if (shippingId <= 0)
                throw new ArgumentException("Invalid shipping ID", nameof(shippingId));

            var shipping = await _shippingRepository.GetByIdAsync(shippingId);
            if (shipping == null)
                throw new InvalidOperationException($"Shipping with ID {shippingId} not found");

            if (!shipping.ShippingStatus.Equals("WAITING", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only shipping with 'WAITING' status can be confirmed");

            if (string.IsNullOrWhiteSpace(shipping.CarrierName))
                throw new InvalidOperationException("Carrier name is required to confirm shipment");

            shipping.ShippingStatus = "PICKED_UP";
            ApplyStatusDates(shipping);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await _shippingRepository.UpdateAsync(shipping);
                await SyncOrderDeliveryStatusAsync(shipping.OrderId, shipping.ShippingStatus);
                await transaction.CommitAsync();
                return shipping;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }


        private static string NormalizeShippingStatus(string? status)
        {
            var normalized = string.IsNullOrWhiteSpace(status)
                ? "WAITING"
                : status.Trim().ToUpperInvariant();

            if (!AllowedShippingStatuses.Contains(normalized))
                throw new ArgumentException("Shipping status is invalid", nameof(status));

            return normalized;
        }

        private static void ApplyStatusDates(Shipping shipping)
        {
            if (shipping.ShippingStatus.Equals("PICKED_UP", StringComparison.OrdinalIgnoreCase)
                && !shipping.ShippedDate.HasValue)
            {
                shipping.ShippedDate = DateTime.Now;
            }

            if (shipping.ShippingStatus.Equals("DELIVERED", StringComparison.OrdinalIgnoreCase)
                && !shipping.DeliveredDate.HasValue)
            {
                shipping.DeliveredDate = DateTime.Now;
            }
        }

        private async Task EnsureOrderExistsAsync(int orderId)
        {
            var exists = await _context.Set<Order>().AnyAsync(order => order.Id == orderId);
            if (!exists)
                throw new InvalidOperationException($"Order with ID {orderId} not found");
        }

        private async Task SyncOrderDeliveryStatusAsync(int orderId, string shippingStatus)
        {
            if (!ShippingToOrderStatuses.TryGetValue(shippingStatus, out var orderStatus))
                return;

            var order = await _context.Set<Order>().FindAsync(orderId);
            if (order == null)
                throw new InvalidOperationException($"Order with ID {orderId} not found");

            if (order.Status.Equals("CANCELLED", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Cannot update delivery status for a cancelled order");

            order.Status = orderStatus;
            _context.Entry(order).Property(x => x.Status).IsModified = true;

            if (orderStatus.Equals("DELIVERED", StringComparison.OrdinalIgnoreCase))
            {
                order.PaymentStatus = "PAID";
                _context.Entry(order).Property(x => x.PaymentStatus).IsModified = true;
            }

            await _context.SaveChangesAsync();
        }
    }
}
