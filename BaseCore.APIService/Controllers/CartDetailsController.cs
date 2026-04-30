using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using System.Linq;

namespace BaseCore.APIService.Controllers
{
    [Route("api/cart-details")]
    [ApiController]
    [Authorize]
    public class CartDetailsController : ControllerBase
    {
        private readonly ICartDetailRepository _cartDetailRepository;
        private readonly IProductRepository _productRepository;

        public CartDetailsController(
            ICartDetailRepository cartDetailRepository,
            IProductRepository productRepository)
        {
            _cartDetailRepository = cartDetailRepository;
            _productRepository = productRepository;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string keyword = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            Expression<Func<CartDetail, bool>>? filter = null;
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                if (int.TryParse(keyword, out var n) && n > 0)
                {
                    filter = cd => cd.ProductId == n;
                }
                else
                {
                    var k = keyword.ToLower();
                    filter = cd => cd.UserId.ToLower().Contains(k);
                }
            }

            Expression<Func<CartDetail, object>> orderBy = cd => (object)cd.Id;

            var (items, totalCount) = await _cartDetailRepository.GetPagedAsync(
                page,
                pageSize,
                filter,
                orderBy,
                descending: true);

            var dtoItems = new List<CartDetailDto>();
            foreach (var cd in items)
            {
                var product = await _productRepository.GetByIdAsync(cd.ProductId);
                dtoItems.Add(new CartDetailDto
                {
                    Id = cd.Id,
                    UserId = cd.UserId,
                    ProductId = cd.ProductId,
                    ProductName = product?.Name,
                    Quantity = cd.Quantity,
                    UnitPrice = cd.UnitPrice,
                    CreatedAt = cd.CreatedAt,
                    UpdatedAt = cd.UpdatedAt
                });
            }

            return Ok(new
            {
                items = dtoItems,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var cd = await _cartDetailRepository.GetByIdAsync(id);
            if (cd == null)
                return NotFound(new { message = "Cart detail not found" });

            var product = await _productRepository.GetByIdAsync(cd.ProductId);

            return Ok(new CartDetailDto
            {
                Id = cd.Id,
                UserId = cd.UserId,
                ProductId = cd.ProductId,
                ProductName = product?.Name,
                Quantity = cd.Quantity,
                UnitPrice = cd.UnitPrice,
                CreatedAt = cd.CreatedAt,
                UpdatedAt = cd.UpdatedAt
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CartDetailCreateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            var cd = new CartDetail
            {
                UserId = dto.UserId ?? "",
                ProductId = dto.ProductId,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = dto.UpdatedAt
            };

            try
            {
                var created = await _cartDetailRepository.AddAsync(cd);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, new { created.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] CartDetailUpdateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            var existing = await _cartDetailRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Cart detail not found" });

            existing.UserId = dto.UserId ?? existing.UserId;
            existing.ProductId = dto.ProductId ?? existing.ProductId;
            existing.Quantity = dto.Quantity ?? existing.Quantity;
            existing.UnitPrice = dto.UnitPrice ?? existing.UnitPrice;
            existing.UpdatedAt = dto.UpdatedAt ?? existing.UpdatedAt;

            try
            {
                await _cartDetailRepository.UpdateAsync(existing);
                return Ok(existing.Id);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            try
            {
                await _cartDetailRepository.DeleteByIdAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class CartDetailDto
        {
            public int Id { get; set; }
            public string UserId { get; set; } = "";
            public int ProductId { get; set; }
            public string? ProductName { get; set; }
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime? UpdatedAt { get; set; }
        }

        public class CartDetailCreateDto
        {
            public string? UserId { get; set; }
            public int ProductId { get; set; }
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public DateTime? UpdatedAt { get; set; }
        }

        public class CartDetailUpdateDto
        {
            public string? UserId { get; set; }
            public int? ProductId { get; set; }
            public int? Quantity { get; set; }
            public decimal? UnitPrice { get; set; }
            public DateTime? UpdatedAt { get; set; }
        }
    }
}

