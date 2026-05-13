using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository;
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
        private static readonly HashSet<string> OrderManagedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "CANCELLED"
        };

        private static readonly HashSet<string> ShippingManagedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "SHIPPED",
            "DELIVERING",
            "DELIVERED",
            "RETURNED"
        };

        private readonly IOrderRepository _orderRepository;
        private readonly IOrderDetailRepository _orderDetailRepository;
        private readonly IProductRepository _productRepository;
        private readonly IPromotionService _promotionService;
        private readonly IRepository<OrderPromotion> _orderPromotionRepository;
        private readonly IOrderService _orderService;
        private readonly AppDbContext _context;

        public OrdersController(
            IOrderRepository orderRepository,
            IOrderDetailRepository orderDetailRepository,
            IProductRepository productRepository,
            IPromotionService promotionService,
            IRepository<OrderPromotion> orderPromotionRepository,
            IOrderService orderService,
            AppDbContext context)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
            _promotionService = promotionService;
            _orderPromotionRepository = orderPromotionRepository;
            _orderService = orderService;
            _context = context;
        }

        /// <summary>
        /// Checkout from user's current cart
        /// </summary>
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var order = await _orderService.CheckoutAsync(userId, dto.ShippingAddress ?? "");
                return Ok(order);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}/user-cancel")]
        public async Task<IActionResult> UserCancel(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                var requestedOrder = await _orderService.UserRequestCancelAsync(id, userId);
                return Ok(new { message = "Yêu cầu hủy đơn đã được gửi, vui lòng chờ shop xác nhận.", order = requestedOrder });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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
            [FromQuery] decimal? finalAmount,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (orders, totalCount) = await _orderRepository.SearchAllAsync(
                keyword,
                status,
                fromDate,
                finalAmount,
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
            var order = await _orderRepository.GetWithDetailsAsync(id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng" });

            // Trả về cấu trúc mà Frontend mong đợi (payload.order và payload.details)
            return Ok(new 
            { 
                order, 
                details = order.OrderDetailOrders 
            });
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

            try
            {
                var items = dto.Items.Select(i => (i.ProductId, i.VariantId, i.Quantity)).ToList();
                
                var order = await _orderService.CreateOrderAsync(
                    userId, 
                    items, 
                    dto.ShippingAddress ?? "", 
                    dto.ShippingFee,
                    dto.PromotionCode,
                    dto.PaymentMethod,
                    dto.Note);

                return CreatedAtAction(nameof(GetById), new { id = order.Id }, new
                {
                    order,
                    details = order.OrderDetailOrders
                });
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.InnerException?.Message 
                              ?? ex.InnerException?.Message 
                              ?? ex.Message;
                return BadRequest(new { message = innerMsg });
            }
        }

        /// <summary>
        /// Update order status
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            if (ShippingManagedStatuses.Contains(dto.Status))
                return BadRequest(new { message = "Trạng thái giao hàng được cập nhật ở bảng vận chuyển" });

            if (!OrderManagedStatuses.Contains(dto.Status))
                return BadRequest(new { message = "Trạng thái đơn hàng không hợp lệ" });

            try
            {
                Order order;
                if (dto.Status.Equals("CANCELLED", StringComparison.OrdinalIgnoreCase))
                {
                    order = await _orderService.ApproveCancelOrderAsync(id);
                }
                else
                {
                    order = await _orderService.UpdateOrderStatusAsync(id, dto.Status);
                }
                return Ok(order);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Cancel order
        /// </summary>
        [HttpPut("{id}/cancel")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            try
            {
                var order = await _orderService.ApproveCancelOrderAsync(id);
                return Ok(new { message = "Đã phê duyệt hủy đơn hàng thành công.", order });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class CreateOrderDto
    {
        public List<OrderItemDto> Items { get; set; } = new();
        public string? ShippingAddress { get; set; }
        public string? PromotionCode { get; set; }
        public decimal ShippingFee { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Note { get; set; }
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int? VariantId { get; set; }
        public int Quantity { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = "";
    }
    public class CheckoutDto
    {
        public string? ShippingAddress { get; set; }
    }
}


