using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class OrderService : IOrderService
    {
        private readonly IRepository<Order> _orderRepository;
        private readonly IRepository<OrderDetail> _orderDetailRepository;
        private readonly IRepository<Product> _productRepository;
        private readonly ICartService _cartService;
        private readonly AppDbContext _context;

        public OrderService(
            IRepository<Order> orderRepository, 
            IRepository<OrderDetail> orderDetailRepository,
            IRepository<Product> productRepository,
            ICartService cartService,
            AppDbContext context)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
            _cartService = cartService;
            _context = context;
        }

        public async Task<Order> CreateOrderAsync(Order order)
        {
            order.OrderDate = DateTime.UtcNow;
            order.Status = "Pending";

            await _orderRepository.AddAsync(order);
            return order;
        }

        public async Task<Order> CheckoutAsync(string userId, string shippingAddress)
        {
            var cart = await _cartService.GetCartWithDetailsAsync(userId);
            if (cart.Items == null || !cart.Items.Any())
            {
                throw new InvalidOperationException("Giỏ hàng của bạn đang trống.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Create Order
                var order = new Order
                {
                    UserId = userId,
                    OrderDate = DateTime.Now,
                    TotalAmount = cart.Total,
                    Status = "Pending",
                    ShippingAddress = shippingAddress
                };

                // Add order (Repository calls SaveChanges internally)
                var createdOrder = await _orderRepository.AddAsync(order);

                // Create OrderDetails and Update Stock
                foreach (var cartItem in cart.Items)
                {
                    var product = await _productRepository.GetByIdAsync(cartItem.ProductId);
                    if (product == null) throw new InvalidOperationException($"Không tìm thấy sản phẩm #{cartItem.ProductId}");
                    
                    if (product.Stock < cartItem.Quantity) 
                        throw new InvalidOperationException($"Sản phẩm '{product.Name}' đã hết hàng hoặc không đủ số lượng.");

                    // Reduce Stock
                    product.Stock -= cartItem.Quantity;
                    await _productRepository.UpdateAsync(product);

                    // Create Detail
                    var orderDetail = new OrderDetail
                    {
                        OrderId = createdOrder.Id,
                        ProductId = cartItem.ProductId,
                        Quantity = cartItem.Quantity,
                        UnitPrice = cartItem.UnitPrice
                    };
                    await _orderDetailRepository.AddAsync(orderDetail);
                }

                // Clear Cart
                await _cartService.ClearCartAsync(userId);

                await transaction.CommitAsync();
                return createdOrder;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<Order> UpdateOrderStatusAsync(int orderId, string status)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) throw new InvalidOperationException("Order not found");

            order.Status = status;
            await _orderRepository.UpdateAsync(order);
            return order;
        }

        public async Task<Order> UserRequestCancelAsync(int orderId, string userId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) throw new InvalidOperationException("Không tìm thấy đơn hàng");
            if (order.UserId != userId) throw new InvalidOperationException("Bạn không có quyền hủy đơn hàng này");

            if (order.Status != "Pending" && order.Status != "CHO_XU_LY")
            {
                throw new InvalidOperationException("Chỉ đơn hàng ở trạng thái 'Chờ xử lý' mới có thể yêu cầu hủy");
            }

            order.Status = "CHO_DUYET_HUY";
            await _orderRepository.UpdateAsync(order);
            return order;
        }

        public async Task<Order> ApproveCancelOrderAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) throw new InvalidOperationException("Không tìm thấy đơn hàng");

            if (order.Status != "CHO_DUYET_HUY")
            {
                throw new InvalidOperationException("Đơn hàng này không có yêu cầu hủy.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Restore Stock
                var details = await _orderDetailRepository.FindAsync(od => od.OrderId == order.Id);
                foreach (var detail in details)
                {
                    var product = await _productRepository.GetByIdAsync(detail.ProductId);
                    if (product != null)
                    {
                        product.Stock += detail.Quantity;
                        await _productRepository.UpdateAsync(product);
                    }
                }

                order.Status = "HUY";
                await _orderRepository.UpdateAsync(order);

                await transaction.CommitAsync();
                return order;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<List<Order>> GetOrdersByUserIdAsync(string userId)
        {
            var orders = await _orderRepository.FindAsync(o => o.UserId == userId);
            var orderList = orders.OrderByDescending(o => o.OrderDate).ToList();

            // Load order details and products
            foreach (var order in orderList)
            {
                var details = await _orderDetailRepository.FindAsync(od => od.OrderId == order.Id);
                order.OrderDetailOrders = details.ToList();

                foreach (var detail in order.OrderDetailOrders)
                {
                    detail.Product = await _productRepository.GetByIdAsync(detail.ProductId);
                }
            }

            return orderList;
        }

        public async Task<Order> GetOrderByIdAsync(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);

            if (order != null)
            {
                var details = await _orderDetailRepository.FindAsync(od => od.OrderId == order.Id);
                order.OrderDetailOrders = details.ToList();

                foreach (var detail in order.OrderDetailOrders)
                {
                    detail.Product = await _productRepository.GetByIdAsync(detail.ProductId);
                }
            }

            return order;
        }
    }
}




