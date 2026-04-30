using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    [Route("api/order-promotions")]
    [ApiController]
    [Authorize]
    public class OrderPromotionsController : ControllerBase
    {
        private readonly IRepository<OrderPromotion> _orderPromotionRepository;
        private readonly IPromotionRepository _promotionRepository;

        public OrderPromotionsController(
            IRepository<OrderPromotion> orderPromotionRepository,
            IPromotionRepository promotionRepository)
        {
            _orderPromotionRepository = orderPromotionRepository;
            _promotionRepository = promotionRepository;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string keyword = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            Expression<Func<OrderPromotion, bool>>? filter = null;
            if (!string.IsNullOrWhiteSpace(keyword) && int.TryParse(keyword, out var n) && n > 0)
            {
                filter = op => op.OrderId == n || op.PromotionId == n;
            }

            Expression<Func<OrderPromotion, object>> orderBy = op => (object)op.Id;

            var (items, totalCount) = await _orderPromotionRepository.GetPagedAsync(
                page,
                pageSize,
                filter,
                orderBy,
                descending: true);

            var dtoItems = new List<OrderPromotionDto>();
            foreach (var op in items)
            {
                var promotion = await _promotionRepository.GetByIdAsync(op.PromotionId);
                dtoItems.Add(new OrderPromotionDto
                {
                    Id = op.Id,
                    OrderId = op.OrderId,
                    PromotionId = op.PromotionId,
                    PromotionCode = promotion?.Code,
                    PromotionName = promotion?.Name,
                    DiscountAmount = op.DiscountAmount,
                    AppliedAt = op.AppliedAt
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
            var op = await _orderPromotionRepository.GetByIdAsync(id);
            if (op == null)
                return NotFound(new { message = "Order promotion not found" });

            var promotion = await _promotionRepository.GetByIdAsync(op.PromotionId);

            return Ok(new OrderPromotionDto
            {
                Id = op.Id,
                OrderId = op.OrderId,
                PromotionId = op.PromotionId,
                PromotionCode = promotion?.Code,
                PromotionName = promotion?.Name,
                DiscountAmount = op.DiscountAmount,
                AppliedAt = op.AppliedAt
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] OrderPromotionCreateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            var op = new OrderPromotion
            {
                OrderId = dto.OrderId,
                PromotionId = dto.PromotionId,
                DiscountAmount = dto.DiscountAmount,
                AppliedAt = DateTime.UtcNow
            };

            try
            {
                var created = await _orderPromotionRepository.AddAsync(op);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created.Id);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] OrderPromotionUpdateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            var existing = await _orderPromotionRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Order promotion not found" });

            existing.OrderId = dto.OrderId ?? existing.OrderId;
            existing.PromotionId = dto.PromotionId ?? existing.PromotionId;
            existing.DiscountAmount = dto.DiscountAmount ?? existing.DiscountAmount;
            existing.AppliedAt = dto.AppliedAt ?? existing.AppliedAt;

            try
            {
                await _orderPromotionRepository.UpdateAsync(existing);
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
                await _orderPromotionRepository.DeleteByIdAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class OrderPromotionDto
        {
            public int Id { get; set; }
            public int OrderId { get; set; }
            public int PromotionId { get; set; }
            public string? PromotionCode { get; set; }
            public string? PromotionName { get; set; }
            public decimal DiscountAmount { get; set; }
            public DateTime AppliedAt { get; set; }
        }

        public class OrderPromotionCreateDto
        {
            public int OrderId { get; set; }
            public int PromotionId { get; set; }
            public decimal DiscountAmount { get; set; }
        }

        public class OrderPromotionUpdateDto
        {
            public int? OrderId { get; set; }
            public int? PromotionId { get; set; }
            public decimal? DiscountAmount { get; set; }
            public DateTime? AppliedAt { get; set; }
        }
    }
}

