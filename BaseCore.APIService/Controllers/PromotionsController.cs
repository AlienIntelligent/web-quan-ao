using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Services;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    [Route("api/promotions")]
    [ApiController]
    [Authorize]
    public class PromotionsController : ControllerBase
    {
        private readonly IPromotionService _promotionService;
        private readonly AppDbContext _context;

        public PromotionsController(IPromotionService promotionService, AppDbContext context)
        {
            _promotionService = promotionService;
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(
            [FromQuery] string keyword = "",
            [FromQuery] bool? isActive = null,
            [FromQuery] string? discountType = null,
            [FromQuery] decimal? discountValue = null,
            [FromQuery] decimal? minimumOrderAmount = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (!User.IsInRole("Admin"))
                isActive = true;

            var (promotions, totalCount) = await _promotionService.SearchAsync(
                string.IsNullOrWhiteSpace(keyword) ? null : keyword,
                isActive,
                string.IsNullOrWhiteSpace(discountType) ? null : discountType,
                discountValue,
                minimumOrderAmount,
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

        [HttpPost("validate")]
        [AllowAnonymous]
        public async Task<IActionResult> Validate([FromBody] PromotionValidateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Code))
                return BadRequest(new { message = "Vui lòng nhập mã giảm giá." });

            try
            {
                var result = await _promotionService.ApplyPromotionAsync(
                    dto.Code,
                    dto.OrderSubtotal,
                    dto.ShippingFee,
                    dto.Lines?.Select(line => new PromotionLine
                    {
                        ProductId = line.ProductId,
                        Subtotal = line.Subtotal
                    }));

                return Ok(new PromotionValidationResultDto
                {
                    PromotionId = result.Promotion.Id,
                    Code = result.Promotion.Code,
                    Name = result.Promotion.Name,
                    DiscountType = result.Promotion.DiscountType,
                    DiscountValue = result.Promotion.DiscountValue,
                    DiscountAmount = result.DiscountAmount,
                    FinalTotal = result.FinalTotal,
                    EligibleSubtotal = result.EligibleSubtotal,
                    HasProductScope = result.HasProductScope,
                    Message = result.Message
                });
            }
            catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
            {
                return BadRequest(new { message = ex.Message });
            }
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

        [HttpGet("{id}/products")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetProducts([FromRoute] int id)
        {
            var promotion = await _promotionService.GetPromotionWithProductsAsync(id);
            if (promotion == null)
                return NotFound(new { message = "Promotion not found" });

            var products = promotion.PromotionProducts
                .OrderBy(pp => pp.Product.Name)
                .Select(pp => new PromotionProductDto
                {
                    Id = pp.Id,
                    ProductId = pp.ProductId,
                    ProductName = pp.Product.Name,
                    Price = pp.Product.Price,
                    ImageUrl = pp.Product.ImageUrl,
                    CategoryName = pp.Product.Category != null ? pp.Product.Category.Name : null
                })
                .ToList();

            return Ok(new
            {
                promotionId = id,
                productIds = products.Select(p => p.ProductId).ToList(),
                products
            });
        }

        [HttpPut("{id}/products")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProducts([FromRoute] int id, [FromBody] PromotionProductsUpdateDto dto)
        {
            var promotion = await _context.Promotions
                .Include(p => p.PromotionProducts)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (promotion == null)
                return NotFound(new { message = "Promotion not found" });

            var productIds = (dto?.ProductIds ?? Array.Empty<int>())
                .Where(productId => productId > 0)
                .Distinct()
                .ToList();

            if (productIds.Count > 0)
            {
                var validProductIds = await _context.Products
                    .Where(p => productIds.Contains(p.Id))
                    .Select(p => p.Id)
                    .ToListAsync();

                var missingIds = productIds.Except(validProductIds).ToList();
                if (missingIds.Count > 0)
                    return BadRequest(new { message = $"Product not found: {string.Join(", ", missingIds)}" });
            }

            _context.PromotionProducts.RemoveRange(promotion.PromotionProducts);
            foreach (var productId in productIds)
            {
                _context.PromotionProducts.Add(new PromotionProduct
                {
                    PromotionId = id,
                    ProductId = productId
                });
            }

            await _context.SaveChangesAsync();
            return await GetProducts(id);
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
                CreatedAt = p.CreatedAt,
                ProductScopeCount = p.PromotionProducts?.Count ?? 0
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
            public int ProductScopeCount { get; set; }
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

        public class PromotionValidateDto
        {
            public string Code { get; set; } = "";
            public decimal OrderSubtotal { get; set; }
            public decimal ShippingFee { get; set; }
            public List<PromotionLineDto>? Lines { get; set; }
        }

        public class PromotionLineDto
        {
            public int ProductId { get; set; }
            public decimal Subtotal { get; set; }
        }

        public class PromotionValidationResultDto
        {
            public int PromotionId { get; set; }
            public string Code { get; set; } = "";
            public string Name { get; set; } = "";
            public string DiscountType { get; set; } = "";
            public decimal DiscountValue { get; set; }
            public decimal DiscountAmount { get; set; }
            public decimal FinalTotal { get; set; }
            public decimal EligibleSubtotal { get; set; }
            public bool HasProductScope { get; set; }
            public string Message { get; set; } = "";
        }

        public class PromotionProductDto
        {
            public int Id { get; set; }
            public int ProductId { get; set; }
            public string ProductName { get; set; } = "";
            public decimal Price { get; set; }
            public string ImageUrl { get; set; } = "";
            public string? CategoryName { get; set; }
        }

        public class PromotionProductsUpdateDto
        {
            public int[] ProductIds { get; set; } = Array.Empty<int>();
        }
    }
}

