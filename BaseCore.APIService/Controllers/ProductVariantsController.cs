using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.APIService.Controllers;

[Route("api/product-variants")]
[ApiController]
public class ProductVariantsController : ControllerBase
{
    private readonly IProductVariantRepository _variantRepository;
    private readonly IProductRepository _productRepository;

    public ProductVariantsController(
        IProductVariantRepository variantRepository,
        IProductRepository productRepository)
    {
        _variantRepository = variantRepository;
        _productRepository = productRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? productId)
    {
        if (productId.HasValue)
        {
            var variantItems = await _variantRepository.GetByProductIdAsync(productId.Value);
            return Ok(variantItems);
        }

        var items = await _variantRepository.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _variantRepository.GetByIdAsync(id);
        return item == null ? NotFound(new { message = "Product variant not found" }) : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] ProductVariantCreateDto dto)
    {
        if (dto == null) return BadRequest(new { message = "Invalid request" });
        if (string.IsNullOrWhiteSpace(dto.Size))
            return BadRequest(new { message = "Size is required" });

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

        var created = await _variantRepository.AddAsync(entity);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductVariantUpdateDto dto)
    {
        if (dto == null) return BadRequest(new { message = "Invalid request" });

        var existing = await _variantRepository.GetByIdAsync(id);
        if (existing == null) return NotFound(new { message = "Product variant not found" });

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

        await _variantRepository.UpdateAsync(existing);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _variantRepository.DeleteByIdAsync(id);
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

