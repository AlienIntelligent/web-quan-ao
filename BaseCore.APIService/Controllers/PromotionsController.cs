using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    [Route("api/promotions")]
    [ApiController]
    [Authorize]
    public class PromotionsController : ControllerBase
    {
        private readonly IPromotionService _promotionService;

        public PromotionsController(IPromotionService promotionService)
        {
            _promotionService = promotionService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string keyword = "",
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (promotions, totalCount) = await _promotionService.SearchAsync(
                string.IsNullOrWhiteSpace(keyword) ? null : keyword,
                isActive,
                page,
                pageSize);

            var items = promotions.Select(p => ToDto(p)).ToList();

            return Ok(new
            {
                items,
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
            var promotion = await _promotionService.GetPromotionByIdAsync(id);
            if (promotion == null)
                return NotFound(new { message = "Promotion not found" });

            return Ok(ToDto(promotion));
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] PromotionCreateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            var promotion = new Promotion
            {
                Code = dto.Code ?? "",
                Name = dto.Name ?? "",
                Description = dto.Description,
                DiscountType = dto.DiscountType ?? "",
                DiscountValue = dto.DiscountValue,
                MinimumOrderAmount = dto.MinimumOrderAmount,
                MaximumDiscountAmount = dto.MaximumDiscountAmount,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                UsageLimit = dto.UsageLimit,
                UsedCount = 0,
                IsActive = dto.IsActive ?? true
            };

            var created = await _promotionService.CreatePromotionAsync(promotion);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] PromotionUpdateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            var existing = await _promotionService.GetPromotionByIdAsync(id);
            if (existing == null) return NotFound(new { message = "Promotion not found" });

            existing.Code = dto.Code ?? existing.Code;
            existing.Name = dto.Name ?? existing.Name;
            existing.Description = dto.Description ?? existing.Description;
            existing.DiscountType = dto.DiscountType ?? existing.DiscountType;
            existing.DiscountValue = dto.DiscountValue ?? existing.DiscountValue;
            existing.MinimumOrderAmount = dto.MinimumOrderAmount ?? existing.MinimumOrderAmount;
            existing.MaximumDiscountAmount = dto.MaximumDiscountAmount ?? existing.MaximumDiscountAmount;
            existing.StartDate = dto.StartDate ?? existing.StartDate;
            existing.EndDate = dto.EndDate ?? existing.EndDate;
            existing.UsageLimit = dto.UsageLimit ?? existing.UsageLimit;
            existing.IsActive = dto.IsActive ?? existing.IsActive;

            await _promotionService.UpdatePromotionAsync(existing);
            return Ok(ToDto(existing));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            try
            {
                await _promotionService.DeletePromotionAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private static PromotionDto ToDto(Promotion p)
        {
            return new PromotionDto
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                DiscountType = p.DiscountType,
                DiscountValue = p.DiscountValue,
                MinimumOrderAmount = p.MinimumOrderAmount,
                MaximumDiscountAmount = p.MaximumDiscountAmount,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                UsageLimit = p.UsageLimit,
                UsedCount = p.UsedCount,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt
            };
        }

        public class PromotionDto
        {
            public int Id { get; set; }
            public string Code { get; set; } = "";
            public string Name { get; set; } = "";
            public string? Description { get; set; }
            public string DiscountType { get; set; } = "";
            public decimal DiscountValue { get; set; }
            public decimal MinimumOrderAmount { get; set; }
            public decimal? MaximumDiscountAmount { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public int? UsageLimit { get; set; }
            public int UsedCount { get; set; }
            public bool IsActive { get; set; }
            public DateTime CreatedAt { get; set; }
        }

        public class PromotionCreateDto
        {
            public string? Code { get; set; }
            public string? Name { get; set; }
            public string? Description { get; set; }
            public string? DiscountType { get; set; }
            public decimal DiscountValue { get; set; }
            public decimal MinimumOrderAmount { get; set; }
            public decimal? MaximumDiscountAmount { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public int? UsageLimit { get; set; }
            public bool? IsActive { get; set; }
        }

        public class PromotionUpdateDto
        {
            public string? Code { get; set; }
            public string? Name { get; set; }
            public string? Description { get; set; }
            public string? DiscountType { get; set; }
            public decimal? DiscountValue { get; set; }
            public decimal? MinimumOrderAmount { get; set; }
            public decimal? MaximumDiscountAmount { get; set; }
            public DateTime? StartDate { get; set; }
            public DateTime? EndDate { get; set; }
            public int? UsageLimit { get; set; }
            public bool? IsActive { get; set; }
        }
    }
}

