using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class ShippingService : IShippingService
    {
        private readonly IShippingRepository _shippingRepository;

        public ShippingService(IShippingRepository shippingRepository)
        {
            _shippingRepository = shippingRepository;
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

            return await _shippingRepository.AddAsync(shipping);
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

            await _shippingRepository.UpdateAsync(shipping);
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

        public async Task<(List<Shipping> Shippings, int TotalCount)> SearchAsync(string? status, string? carrierName, int page, int pageSize)
        {
            if (page < 1)
                throw new ArgumentException("Page number must be greater than 0", nameof(page));

            if (pageSize < 1 || pageSize > 100)
                throw new ArgumentException("Page size must be between 1 and 100", nameof(pageSize));

            var result = await _shippingRepository.SearchAsync(status, carrierName, page, pageSize);
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

            shipping.ShippingStatus = newStatus;
            await _shippingRepository.UpdateAsync(shipping);
        }
    }
}
