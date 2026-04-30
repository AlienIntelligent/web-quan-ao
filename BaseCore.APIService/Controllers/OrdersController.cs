using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using BaseCore.Services;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    /// <summary>
    /// Order API Controller
    /// Teaching: RESTful API, Business Logic, Authentication (Bài 10, 11)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "CHO_XU_LY",
            "DANG_VAN_CHUYEN",
            "DA_VAN_CHUYEN",
            "HUY",
            "Pending",
            "Shipping",
            "Delivered",
            "Cancelled"
        };

        private readonly IOrderRepository _orderRepository;
        private readonly IOrderDetailRepository _orderDetailRepository;
        private readonly IProductRepository _productRepository;
        private readonly IPromotionService _promotionService;
        private readonly IRepository<OrderPromotion> _orderPromotionRepository;

        public OrdersController(
            IOrderRepository orderRepository,
            IOrderDetailRepository orderDetailRepository,
            IProductRepository productRepository,
            IPromotionService promotionService,
            IRepository<OrderPromotion> orderPromotionRepository)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
            _promotionService = promotionService;
            _orderPromotionRepository = orderPromotionRepository;
        }

        /// <summary>
        /// Get orders for current user
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var orders = await _orderRepository.GetByUserAsync(userId);
            return Ok(orders);
        }

        /// <summary>
        /// Get all orders (Admin only)
        /// </summary>
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders(
            [FromQuery] string? keyword,
            [FromQuery] string? status,
            [FromQuery] DateTime? fromDate,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (orders, totalCount) = await _orderRepository.SearchAllAsync(
                keyword,
                status,
                fromDate,
                page,
                pageSize);

            return Ok(new
            {
                items = orders,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        /// <summary>
        /// Get order by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            var details = await _orderDetailRepository.GetByOrderAsync(id);
            return Ok(new { order, details });
        }

        /// <summary>
        /// Create new order
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Validate products and calculate subtotal
            decimal subtotal = 0;
            var orderDetails = new List<OrderDetail>();
            var productsToUpdate = new List<Product>();

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0)
                    return BadRequest(new { message = "Quantity must be greater than 0" });

                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product == null)
                    return BadRequest(new { message = $"Product {item.ProductId} not found" });

                if (product.Stock < item.Quantity)
                    return BadRequest(new { message = $"Insufficient stock for {product.Name}" });

                subtotal += product.Price * item.Quantity;
                orderDetails.Add(new OrderDetail
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price
                });

                product.Stock -= item.Quantity;
                productsToUpdate.Add(product);
            }

            var shippingFee = Math.Max(0, dto.ShippingFee);
            PromotionApplicationResult? promotionResult = null;

            if (!string.IsNullOrWhiteSpace(dto.PromotionCode))
            {
                try
                {
                    promotionResult = await _promotionService.ApplyPromotionAsync(
                        dto.PromotionCode,
                        subtotal,
                        shippingFee);
                }
                catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
                {
                    return BadRequest(new { message = ex.Message });
                }
            }

            var totalAmount = promotionResult?.FinalTotal ?? subtotal + shippingFee;

            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.Now,
                TotalAmount = totalAmount,
                Status = "CHO_XU_LY",
                ShippingAddress = dto.ShippingAddress ?? ""
            };

            await _orderRepository.AddAsync(order);

            // Add order details
            foreach (var detail in orderDetails)
            {
                detail.OrderId = order.Id;
                await _orderDetailRepository.AddAsync(detail);
            }

            foreach (var product in productsToUpdate)
            {
                await _productRepository.UpdateAsync(product);
            }

            if (promotionResult != null)
            {
                await _orderPromotionRepository.AddAsync(new OrderPromotion
                {
                    OrderId = order.Id,
                    PromotionId = promotionResult.Promotion.Id,
                    DiscountAmount = promotionResult.DiscountAmount,
                    AppliedAt = DateTime.Now
                });

                promotionResult.Promotion.UsedCount += 1;
                await _promotionService.UpdatePromotionAsync(promotionResult.Promotion);
            }

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new
            {
                order,
                details = orderDetails,
                promotion = promotionResult == null
                    ? null
                    : new
                    {
                        id = promotionResult.Promotion.Id,
                        code = promotionResult.Promotion.Code,
                        discountAmount = promotionResult.DiscountAmount
                    }
            });
        }

        /// <summary>
        /// Update order status
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            if (!AllowedStatuses.Contains(dto.Status))
                return BadRequest(new { message = "Invalid order status" });

            order.Status = dto.Status;
            await _orderRepository.UpdateAsync(order);

            return Ok(order);
        }

        /// <summary>
        /// Cancel order
        /// </summary>
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            if (order.Status is "DA_VAN_CHUYEN" or "Delivered")
                return BadRequest(new { message = "Cannot cancel completed order" });

            // Restore stock
            var details = await _orderDetailRepository.GetByOrderAsync(id);
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

            return Ok(new { message = "Order cancelled successfully", order });
        }
    }

    public class CreateOrderDto
    {
        public List<OrderItemDto> Items { get; set; } = new();
        public string? ShippingAddress { get; set; }
        public string? PromotionCode { get; set; }
        public decimal ShippingFee { get; set; }
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = "";
    }
}


