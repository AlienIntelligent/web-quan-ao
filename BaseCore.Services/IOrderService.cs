using BaseCore.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public interface IOrderService
    {
        Task<Order> CreateOrderAsync(
            string userId, 
            List<(int ProductId, int? VariantId, int Quantity)> items, 
            string shippingAddress, 
            string? promotionCode = null,
            string? paymentMethod = null,
            string? note = null);

        Task<List<Order>> GetOrdersByUserIdAsync(string userId);
        Task<Order> GetOrderByIdAsync(int id);
        Task<Order> CheckoutAsync(string userId, string shippingAddress);
        Task<Order> UpdateOrderStatusAsync(int orderId, string status);
        Task<Order> UserRequestCancelAsync(int orderId, string userId);
        Task<Order> ApproveCancelOrderAsync(int orderId);
    }
}


