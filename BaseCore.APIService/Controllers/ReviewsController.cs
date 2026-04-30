using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
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

    public ReviewsController(
        IReviewRepository reviewRepository,
        IProductRepository productRepository,
        IUserRepository userRepository)
    {
        _reviewRepository = reviewRepository;
        _productRepository = productRepository;
        _userRepository = userRepository;
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
                UserName = user?.Name ?? user?.UserName ?? r.UserId,
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
            UserName = user?.Name ?? user?.UserName ?? review.UserId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] ReviewCreateDto dto)
    {
        if (dto == null) return BadRequest(new { message = "Invalid request" });
        if (dto.Rating < 1 || dto.Rating > 5) return BadRequest(new { message = "Rating must be 1-5" });

        var product = await _productRepository.GetByIdAsync(dto.ProductId);
        if (product == null) return BadRequest(new { message = "Product not found" });

        var user = await _userRepository.GetByIdAsync(dto.UserId);
        if (user == null) return BadRequest(new { message = "User not found" });

        var entity = new Review
        {
            ProductId = dto.ProductId,
            UserId = dto.UserId,
            Rating = dto.Rating,
            Comment = dto.Comment,
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
        public int ProductId { get; set; }
        public string UserId { get; set; } = "";
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

