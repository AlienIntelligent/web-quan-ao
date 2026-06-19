using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers;

[Route("api/product-variants")]
[ApiController]
public class ProductVariantsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IProductRepository _productRepository;

    public ProductVariantsController(
        AppDbContext context,
        IProductRepository productRepository)
    {
        _context = context;
        _productRepository = productRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string keyword = "",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? productId = null)
    {
        var query = _context.ProductVariants.AsQueryable();

        if (productId.HasValue)
            query = query.Where(v => v.ProductId == productId.Value);
        else if (!string.IsNullOrWhiteSpace(keyword) && int.TryParse(keyword, out var id) && id > 0)
            query = query.Where(v => v.ProductId == id);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(v => v.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new
            {
                v.Id,
                v.ProductId,
                Size = v.SizeNavigation != null ? v.SizeNavigation.Name : (v.Size ?? "Mặc định"),
                Color = v.ColorNavigation != null ? v.ColorNavigation.Name : (v.Color ?? "Mặc định"),
                v.SizeId,
                v.ColorId,
                ColorHexCode = v.ColorNavigation != null ? v.ColorNavigation.HexCode : null,
                v.Stock,
                v.Price,
                ImageUrl = v.ProductVariantImages
                    .OrderByDescending(i => i.IsDefault)
                    .ThenBy(i => i.SortOrder)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault()
            })
            .ToListAsync();

        
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
    public async Task<IActionResult> GetById(int id)
    {
        var variant = await _context.ProductVariants
            .Where(v => v.Id == id)
            .Select(v => new
            {
                v.Id,
                v.ProductId,
                v.SizeId,
                v.ColorId,
                ColorHexCode = v.ColorNavigation != null ? v.ColorNavigation.HexCode : null,
                Size = v.Size ?? "Mặc định",
                Color = v.Color ?? "Mặc định",
                v.Stock,
                v.Price,
                ImageUrl = v.ProductVariantImages
                    .OrderByDescending(i => i.IsDefault)
                    .ThenBy(i => i.SortOrder)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync();

        if (variant == null)
            return NotFound(new { message = "Product variant not found" });

        return Ok(variant);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] ProductVariantCreateDto dto)
    {
        if (dto == null) return BadRequest(new { message = "Invalid request" });

        var size = await ResolveSizeAsync(dto.SizeId, dto.Size);
        if (dto.SizeId.HasValue && size == null)
            return BadRequest(new { message = "Size not found" });

        var sizeName = size?.Name ?? dto.Size?.Trim();
        if (string.IsNullOrWhiteSpace(sizeName))
            return BadRequest(new { message = "Size is required" });

        var color = await ResolveColorAsync(dto.ColorId, dto.Color);
        if (dto.ColorId.HasValue && color == null)
            return BadRequest(new { message = "Color not found" });

        var colorName = color?.Name ?? (string.IsNullOrWhiteSpace(dto.Color) ? null : dto.Color.Trim());

        if (dto.Stock < 0)
            return BadRequest(new { message = "Stock cannot be negative" });
        if (dto.Price < 0)
            return BadRequest(new { message = "Price cannot be negative" });

        var product = await _productRepository.GetByIdAsync(dto.ProductId);
        if (product == null) return BadRequest(new { message = "Product not found" });

        var entity = new ProductVariant
        {
            ProductId = dto.ProductId,
            Size = sizeName,
            Color = colorName,
            SizeId = size?.Id,
            ColorId = color?.Id,
            Stock = dto.Stock,
            Price = dto.Price
        };

        _context.ProductVariants.Add(entity);
        await _context.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            _context.ProductVariantImages.Add(new ProductVariantImage
            {
                ProductVariantId = entity.Id,
                ImageUrl = dto.ImageUrl,
                IsDefault = true,
                SortOrder = 0
            });

            await _context.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);    

        
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductVariantUpdateDto dto)
    {
        if (dto == null) return BadRequest(new { message = "Invalid request" });

        var existing = await _context.ProductVariants.FindAsync(id);
        if (existing == null) return NotFound(new { message = "Product variant not found" });
        if (dto.Stock.HasValue && dto.Stock.Value < 0)
            return BadRequest(new { message = "Stock cannot be negative" });
        if (dto.Price.HasValue && dto.Price.Value < 0)
            return BadRequest(new { message = "Price cannot be negative" });

        if (dto.ProductId.HasValue)
        {
            var product = await _productRepository.GetByIdAsync(dto.ProductId.Value);
            if (product == null) return BadRequest(new { message = "Product not found" });
            existing.ProductId = dto.ProductId.Value;
        }

        if (dto.SizeId.HasValue)
        {
            var size = await ResolveSizeAsync(dto.SizeId, null);
            if (size == null) return BadRequest(new { message = "Size not found" });
            existing.SizeId = size.Id;
            existing.Size = size.Name;
        }
        else if (dto.Size != null)
        {
            var sizeName = dto.Size.Trim();
            if (string.IsNullOrWhiteSpace(sizeName))
                return BadRequest(new { message = "Size is required" });

            var size = await ResolveSizeAsync(null, sizeName);
            existing.SizeId = size?.Id;
            existing.Size = sizeName;
        }

        if (string.IsNullOrWhiteSpace(existing.Size))
            return BadRequest(new { message = "Size is required" });

        if (dto.ColorId.HasValue)
        {
            var color = await ResolveColorAsync(dto.ColorId, null);
            if (color == null) return BadRequest(new { message = "Color not found" });
            existing.ColorId = color.Id;
            existing.Color = color.Name;
        }
        else if (dto.Color != null)
        {
            var colorName = dto.Color.Trim();
            var color = await ResolveColorAsync(null, colorName);
            existing.ColorId = color?.Id;
            existing.Color = string.IsNullOrWhiteSpace(colorName) ? null : colorName;
        }

        existing.Stock = dto.Stock ?? existing.Stock;
        existing.Price = dto.Price ?? existing.Price;

        if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            var image = await _context.ProductVariantImages
                .FirstOrDefaultAsync(x => x.ProductVariantId == id && x.IsDefault);

            if (image == null)
            {
                _context.ProductVariantImages.Add(new ProductVariantImage
                {
                    ProductVariantId = id,
                    ImageUrl = dto.ImageUrl,
                    IsDefault = true,
                    SortOrder = 0
                });
            }
            else
            {
                image.ImageUrl = dto.ImageUrl;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var variant = await _context.ProductVariants.FindAsync(id);
        if (variant != null)
        {
            _context.ProductVariants.Remove(variant);
            await _context.SaveChangesAsync();
        }
        return NoContent();
    }

    public class ProductVariantCreateDto
    {
        public int ProductId { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public int? SizeId { get; set; }
        public int? ColorId { get; set; }
        public int Stock { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class ProductVariantUpdateDto
    {
        public int? ProductId { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public int? SizeId { get; set; }
        public int? ColorId { get; set; }
        public int? Stock { get; set; }
        public decimal? Price { get; set; }
        public string? ImageUrl { get; set; }
    }

    private async Task<Size?> ResolveSizeAsync(int? sizeId, string? sizeName)
    {
        if (sizeId.HasValue)
            return await _context.Sizes.FirstOrDefaultAsync(s => s.Id == sizeId.Value);

        if (string.IsNullOrWhiteSpace(sizeName))
            return null;

        var normalized = sizeName.Trim().ToLower();
        return await _context.Sizes.FirstOrDefaultAsync(s => s.Name.ToLower() == normalized);
    }

    private async Task<Color?> ResolveColorAsync(int? colorId, string? colorName)
    {
        if (colorId.HasValue)
            return await _context.Colors.FirstOrDefaultAsync(c => c.Id == colorId.Value);

        if (string.IsNullOrWhiteSpace(colorName))
            return null;

        var normalized = colorName.Trim().ToLower();
        return await _context.Colors.FirstOrDefaultAsync(c => c.Name.ToLower() == normalized);
    }
}
