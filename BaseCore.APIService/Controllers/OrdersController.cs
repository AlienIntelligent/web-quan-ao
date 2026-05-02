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
        private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "CHO_XU_LY",
            "DANG_VAN_CHUYEN",
            "DA_VAN_CHUYEN",
            "HUY",
            "CHO_DUYET_HUY",
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

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate products and calculate subtotal
                decimal subtotal = 0;
                var orderDetails = new List<OrderDetail>();
                var productsToUpdate = new List<Product>();

                foreach (var item in dto.Items)
                {
                    if (item.Quantity <= 0)
                        return BadRequest(new { message = "Số lượng phải lớn hơn 0" });

                    var product = await _productRepository.GetByIdAsync(item.ProductId);
                    if (product == null)
                        return BadRequest(new { message = $"Sản phẩm #{item.ProductId} không tồn tại" });

                    if (product.Stock < item.Quantity)
                        return BadRequest(new { message = $"Sản phẩm {product.Name} không đủ tồn kho" });

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

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetById), new { id = order.Id }, new
                {
                    order,
                    details = orderDetails,
                    promotion = promotionResult == null ? null : new
                    {
                        id = promotionResult.Promotion.Id,
                        code = promotionResult.Promotion.Code,
                        discountAmount = promotionResult.DiscountAmount
                    }
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi hệ thống: " + ex.Message });
            }
        }

        /// <summary>
        /// Update order status
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            if (!AllowedStatuses.Contains(dto.Status))
                return BadRequest(new { message = "Trạng thái đơn hàng không hợp lệ" });

            try
            {
                Order order;
                if (dto.Status.Equals("HUY", StringComparison.OrdinalIgnoreCase))
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
    public class CheckoutDto
    {
        public string? ShippingAddress { get; set; }
    }
}


