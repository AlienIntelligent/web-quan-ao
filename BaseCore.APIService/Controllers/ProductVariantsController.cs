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
                Size = v.Size ?? "M?c ??nh",
                Color = v.Color ?? "M?c ??nh",
                v.Stock,
                v.Price
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
                Size = v.Size ?? "M?c ??nh",
                Color = v.Color ?? "M?c ??nh",
                v.Stock,
                v.Price
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
        if (string.IsNullOrWhiteSpace(dto.Size))
            return BadRequest(new { message = "Size is required" });
        if (dto.Stock < 0)
            return BadRequest(new { message = "Stock cannot be negative" });
        if (dto.Price < 0)
            return BadRequest(new { message = "Price cannot be negative" });

        var product = await _productRepository.GetByIdAsync(dto.ProductId);
        if (product == null) return BadRequest(new { message = "Product not found" });

        var entity = new ProductVariant
        {
            ProductId = dto.ProductId,
            Size = dto.Size,
            Color = dto.Color,
            Stock = dto.Stock,
            Price = dto.Price
        };

        _context.ProductVariants.Add(entity);
        await _context.SaveChangesAsync();

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

        existing.Size = dto.Size ?? existing.Size;
        if (string.IsNullOrWhiteSpace(existing.Size))
            return BadRequest(new { message = "Size is required" });
        existing.Color = dto.Color ?? existing.Color;
        existing.Stock = dto.Stock ?? existing.Stock;
        existing.Price = dto.Price ?? existing.Price;

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
        public int Stock { get; set; }
        public decimal Price { get; set; }
    }

    public class ProductVariantUpdateDto
    {
        public int? ProductId { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public int? Stock { get; set; }
        public decimal? Price { get; set; }
    }
}