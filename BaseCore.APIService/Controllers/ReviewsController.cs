using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.APIService.Controllers;

[Route("api/reviews")]
[ApiController]
public class ReviewsController : ControllerBase
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUserRepository _userRepository;
    private readonly IOrderRepository _orderRepository;

    public ReviewsController(
        IReviewRepository reviewRepository,
        IProductRepository productRepository,
        IUserRepository userRepository,
        IOrderRepository orderRepository)
    {
        _reviewRepository = reviewRepository;
        _productRepository = productRepository;
        _userRepository = userRepository;
        _orderRepository = orderRepository;
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMine()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var reviews = await _reviewRepository.GetByUserIdAsync(userId);
        return Ok(reviews.Select(r => new ReviewDto
        {
            Id = r.Id,
            ProductId = r.ProductId,
            UserId = r.UserId,
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt
        }));
    }

    // Public: list reviews for product + rating summary
    [HttpGet]
    public async Task<IActionResult> GetByProduct(
        [FromQuery] int productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, totalCount, averageRating) =
            await _reviewRepository.GetPagedByProductIdAsync(productId, page, pageSize);

        var dtoItems = new List<ReviewDto>();
        foreach (var r in items)
        {
            User? user = null;
            if (!string.IsNullOrWhiteSpace(r.UserId))
            {
                try
                {
                    user = await _userRepository.GetByIdAsync(r.UserId);
                }
                catch
                {
                    // Do not fail the whole reviews list because of a bad/missing user reference.
                    user = null;
                }
            }
            dtoItems.Add(new ReviewDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                UserId = r.UserId,
                UserName = user?.Name ?? user?.UserName ?? "Khách hàng",
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            });
        }

        return Ok(new
        {
            items = dtoItems,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
            averageRating
        });
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var review = await _reviewRepository.GetByIdAsync(id);
        if (review == null) return NotFound(new { message = "Review not found" });

        var user = await _userRepository.GetByIdAsync(review.UserId);
        return Ok(new ReviewDto
        {
            Id = review.Id,
            ProductId = review.ProductId,
            UserId = review.UserId,
            UserName = user?.Name ?? user?.UserName ?? "Khách hàng",
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] ReviewCreateDto dto)
    {
        if (dto == null) return BadRequest(new { message = "Invalid request" });
        if (dto.Rating < 1 || dto.Rating > 5) return BadRequest(new { message = "Số sao phải từ 1 đến 5." });
        if (dto.Comment?.Length > 1000) return BadRequest(new { message = "Nội dung đánh giá không được vượt quá 1000 ký tự." });

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var product = await _productRepository.GetByIdAsync(dto.ProductId);
        if (product == null) return BadRequest(new { message = "Không tìm thấy sản phẩm." });

        var order = await _orderRepository.GetWithDetailsAsync(dto.OrderId);
        if (order == null || order.UserId != userId)
            return BadRequest(new { message = "Không tìm thấy đơn hàng của bạn." });

        if (!string.Equals(order.Status, "DELIVERED", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Bạn chỉ có thể đánh giá sau khi đơn hàng đã giao thành công." });

        if (!order.OrderDetailOrders.Any(detail => detail.ProductId == dto.ProductId))
            return BadRequest(new { message = "Sản phẩm không thuộc đơn hàng này." });

        var existing = await _reviewRepository.GetByUserAndProductAsync(userId, dto.ProductId);
        if (existing != null)
            return Conflict(new { message = "Bạn đã đánh giá sản phẩm này." });

        var entity = new Review
        {
            ProductId = dto.ProductId,
            UserId = userId,
            Rating = dto.Rating,
            Comment = dto.Comment?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var created = await _reviewRepository.AddAsync(entity);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ReviewUpdateDto dto)
    {
        if (dto == null) return BadRequest(new { message = "Invalid request" });

        var existing = await _reviewRepository.GetByIdAsync(id);
        if (existing == null) return NotFound(new { message = "Review not found" });

        if (dto.ProductId.HasValue)
        {
            var product = await _productRepository.GetByIdAsync(dto.ProductId.Value);
            if (product == null) return BadRequest(new { message = "Product not found" });
            existing.ProductId = dto.ProductId.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.UserId))
        {
            var user = await _userRepository.GetByIdAsync(dto.UserId);
            if (user == null) return BadRequest(new { message = "User not found" });
            existing.UserId = dto.UserId;
        }

        if (dto.Rating.HasValue)
        {
            if (dto.Rating.Value < 1 || dto.Rating.Value > 5)
                return BadRequest(new { message = "Rating must be 1-5" });
            existing.Rating = dto.Rating.Value;
        }

        existing.Comment = dto.Comment ?? existing.Comment;

        await _reviewRepository.UpdateAsync(existing);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _reviewRepository.DeleteByIdAsync(id);
        return NoContent();
    }

    public class ReviewDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string UserId { get; set; } = "";
        public string UserName { get; set; } = "";
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ReviewCreateDto
    {
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class ReviewUpdateDto
    {
        public int? ProductId { get; set; }
        public string? UserId { get; set; }
        public int? Rating { get; set; }
        public string? Comment { get; set; }
    }
}

