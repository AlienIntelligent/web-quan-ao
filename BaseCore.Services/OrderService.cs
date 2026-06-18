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
        private readonly IRepository<ProductVariant> _variantRepository;
        private readonly IRepository<OrderPromotion> _orderPromotionRepository;
        private readonly IPromotionService _promotionService;
        private readonly ICartService _cartService;
        private readonly AppDbContext _context;

        public OrderService(
            IRepository<Order> orderRepository, 
            IRepository<OrderDetail> orderDetailRepository,
            IRepository<Product> productRepository,
            IRepository<ProductVariant> variantRepository,
            IRepository<OrderPromotion> orderPromotionRepository,
            IPromotionService promotionService,
            ICartService cartService,
            AppDbContext context)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
            _variantRepository = variantRepository;
            _orderPromotionRepository = orderPromotionRepository;
            _promotionService = promotionService;
            _cartService = cartService;
            _context = context;
        }

        private string GenerateOrderCode()
        {
            return $"ORD-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
        }

        public async Task<Order> CreateOrderAsync(
            string userId, 
            List<(int ProductId, int? VariantId, int Quantity)> items, 
            string shippingAddress, 
            decimal shippingFee,
            string? promotionCode = null,
            string? paymentMethod = null,
            string? note = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                decimal subtotal = 0;
                var orderDetails = new List<OrderDetail>();

                foreach (var item in items)
                {
                    var product = await _productRepository.GetByIdAsync(item.ProductId);
                    if (product == null) throw new InvalidOperationException($"Sản phẩm #{item.ProductId} không tồn tại");

                    decimal unitPrice = product.Price;
                    
                    if (item.VariantId.HasValue)
                    {
                        var variant = await _variantRepository.GetByIdAsync(item.VariantId.Value);
                        if (variant == null || variant.ProductId != item.ProductId)
                            throw new InvalidOperationException($"Biến thể #{item.VariantId} không hợp lệ cho sản phẩm {product.Name}");

                        if (variant.Stock < item.Quantity)
                            throw new InvalidOperationException($"Biến thể của sản phẩm {product.Name} không đủ tồn kho");

                        unitPrice = variant.Price;
                        variant.Stock -= item.Quantity;
                        _context.Set<ProductVariant>().Update(variant);
                    }
                    else
                    {
                        if (product.Stock < item.Quantity)
                            throw new InvalidOperationException($"Sản phẩm {product.Name} không đủ tồn kho");
                        
                        product.Stock -= item.Quantity;
                        _context.Set<Product>().Update(product);
                    }

                    subtotal += unitPrice * item.Quantity;
                    orderDetails.Add(new OrderDetail
                    {
                        ProductId = item.ProductId,
                        VariantId = item.VariantId,  // null when no variant - fixes FK violation
                        Quantity = item.Quantity,
                        UnitPrice = unitPrice
                    });
                }

                PromotionApplicationResult? promotionResult = null;
                if (!string.IsNullOrWhiteSpace(promotionCode))
                {
                    var promotionLines = orderDetails
                        .Select(detail => new PromotionLine
                        {
                            ProductId = detail.ProductId,
                            Subtotal = detail.UnitPrice * detail.Quantity
                        })
                        .ToList();

                    promotionResult = await _promotionService.ApplyPromotionAsync(
                        promotionCode,
                        subtotal,
                        shippingFee,
                        promotionLines);
                }

                var totalAmount = subtotal + shippingFee;
                var discountAmount = promotionResult?.DiscountAmount ?? 0;
                var finalAmount = promotionResult?.FinalTotal ?? (totalAmount - discountAmount);

                var order = new Order
                {
                    UserId = userId,
                    OrderCode = GenerateOrderCode(),
                    OrderDate = DateTime.Now,
                    TotalAmount = totalAmount,
                    DiscountAmount = discountAmount,
                    FinalAmount = finalAmount,
                    ShippingFee = shippingFee,
                    Status = "PENDING",
                    PaymentMethod = paymentMethod ?? "COD",
                    PaymentStatus = "Pending",
                    ShippingAddress = shippingAddress,
                    Note = note
                };

                // Save stock changes + order together
                await _context.Set<Order>().AddAsync(order);
                await _context.SaveChangesAsync(); // Gets order.Id

                foreach (var detail in orderDetails)
                {
                    detail.OrderId = order.Id;
                    await _context.Set<OrderDetail>().AddAsync(detail);
                }

                if (promotionResult != null)
                {
                    await _context.Set<OrderPromotion>().AddAsync(new OrderPromotion
                    {
                        OrderId = order.Id,
                        PromotionId = promotionResult.Promotion.Id,
                        DiscountAmount = promotionResult.DiscountAmount,
                        AppliedAt = DateTime.Now
                    });

                    promotionResult.Promotion.UsedCount += 1;
                    _context.Set<Promotion>().Update(promotionResult.Promotion);
                }

                // Save details, promotions and stock changes in one shot
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                order.OrderDetailOrders = orderDetails;
                return order;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<Order> CheckoutAsync(string userId, string shippingAddress)
        {
            var cart = await _cartService.GetCartWithDetailsAsync(userId);
            if (cart.Items == null || !cart.Items.Any())
            {
                throw new InvalidOperationException("Giỏ hàng của bạn đang trống.");
            }

            var items = cart.Items.Select(i => (i.ProductId, (int?)null, i.Quantity)).ToList();
            var order = await CreateOrderAsync(userId, items, shippingAddress, 30000); // Default shipping fee
            
            await _cartService.ClearCartAsync(userId);
            return order;
        }

        public async Task<Order> UpdateOrderStatusAsync(int orderId, string status)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) throw new InvalidOperationException("Không tìm thấy đơn hàng");

            // Chỉ cập nhật Status để tránh lỗi nếu DB thiếu các cột khác (OrderCode, PaymentStatus...)
            _context.Entry(order).Property(x => x.Status).IsModified = true;
            order.Status = status;

            // Cập nhật PaymentStatus khi giao thành công
            if (status.Equals("DELIVERED", StringComparison.OrdinalIgnoreCase))
            {
                order.PaymentStatus = "PAID";
                _context.Entry(order).Property(x => x.PaymentStatus).IsModified = true;
            }

            await _context.SaveChangesAsync();
            return order;
        }

        public async Task<Order> UserRequestCancelAsync(int orderId, string userId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) throw new InvalidOperationException("Không tìm thấy đơn hàng");
            if (order.UserId != userId) throw new InvalidOperationException("Bạn không có quyền hủy đơn hàng này");

            if (order.Status != "PENDING" && order.Status != "CONFIRMED")
            {
                throw new InvalidOperationException("Chỉ đơn hàng ở trạng thái 'Chờ xử lý' mới có thể yêu cầu hủy");
            }

            order.Status = "PROCESSING";
            _context.Entry(order).Property(x => x.Status).IsModified = true;
            await _context.SaveChangesAsync();
            return order;
        }

        public async Task<Order> ApproveCancelOrderAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) throw new InvalidOperationException("Không tìm thấy đơn hàng");

            if (order.Status == "DELIVERED")
            {
                throw new InvalidOperationException("Không thể hủy đơn hàng đã giao thành công.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Restore Stock
                var details = await _orderDetailRepository.FindAsync(od => od.OrderId == order.Id);
                foreach (var detail in details)
                {
                    if (detail.VariantId.HasValue && detail.VariantId.Value > 0)
                    {
                        var variant = await _variantRepository.GetByIdAsync(detail.VariantId.Value);
                        if (variant != null)
                        {
                            variant.Stock += detail.Quantity;
                            _context.Set<ProductVariant>().Update(variant);
                        }
                    }
                    else
                    {
                        var product = await _productRepository.GetByIdAsync(detail.ProductId);
                        if (product != null)
                        {
                            product.Stock += detail.Quantity;
                            _context.Set<Product>().Update(product);
                        }
                    }
                }

                order.Status = "CANCELLED";
                _context.Entry(order).Property(x => x.Status).IsModified = true;
                
                // Thử cập nhật CancelledAt nếu có
                try {
                    order.CancelledAt = DateTime.Now;
                    _context.Entry(order).Property(x => x.CancelledAt).IsModified = true;
                } catch { }

                await _context.SaveChangesAsync();
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




