using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using BaseCore.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    [Route("api/product-origins")]
    [ApiController]
    [Authorize]
    public class ProductOriginsController : ControllerBase
    {
        private readonly IProductOriginService _productOriginService;
        private readonly IProductOriginRepository _productOriginRepository;
        private readonly IProductRepository _productRepository;
        private readonly IOriginRepository _originRepository;

        public ProductOriginsController(
            IProductOriginService productOriginService,
            IProductOriginRepository productOriginRepository,
            IProductRepository productRepository,
            IOriginRepository originRepository)
        {
            _productOriginService = productOriginService;
            _productOriginRepository = productOriginRepository;
            _productRepository = productRepository;
            _originRepository = originRepository;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string keyword = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            Expression<Func<ProductOrigin, bool>>? filter = null;
            if (!string.IsNullOrWhiteSpace(keyword) && int.TryParse(keyword, out var n) && n > 0)
            {
                filter = po => po.ProductId == n || po.OriginId == n;
            }

            Expression<Func<ProductOrigin, object>> orderBy = po => (object)po.Id;

            var (items, totalCount) = await _productOriginRepository.GetPagedAsync(
                page,
                pageSize,
                filter,
                orderBy,
                descending: true);

            var dtoItems = new List<ProductOriginDto>();
            foreach (var po in items)
            {
                var product = await _productRepository.GetByIdAsync(po.ProductId);
                var origin = await _originRepository.GetByIdAsync(po.OriginId);

                dtoItems.Add(new ProductOriginDto
                {
                    Id = po.Id,
                    ProductId = po.ProductId,
                    ProductName = product?.Name,
                    OriginId = po.OriginId,
                    OriginName = origin?.Name
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
            try
            {
                var po = await _productOriginService.GetProductOriginByIdAsync(id);
                var product = await _productRepository.GetByIdAsync(po.ProductId);
                var origin = await _originRepository.GetByIdAsync(po.OriginId);

                return Ok(new ProductOriginDto
                {
                    Id = po.Id,
                    ProductId = po.ProductId,
                    ProductName = product?.Name,
                    OriginId = po.OriginId,
                    OriginName = origin?.Name
                });
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] ProductOriginCreateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            try
            {
                var po = new ProductOrigin
                {
                    ProductId = dto.ProductId,
                    OriginId = dto.OriginId
                };

                var created = await _productOriginService.CreateProductOriginAsync(po);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] ProductOriginUpdateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            try
            {
                var existing = await _productOriginService.GetProductOriginByIdAsync(id);
                existing.ProductId = dto.ProductId;
                existing.OriginId = dto.OriginId;

                await _productOriginService.UpdateProductOriginAsync(existing);
                return Ok(ToDto(existing));
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
                await _productOriginService.DeleteProductOriginAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private ProductOriginDto ToDto(ProductOrigin po)
        {
            // Không phụ thuộc navigation (tránh serialize vòng).
            // Thêm tên sẽ được fill ở GetAll theo yêu cầu hiển thị.
            return new ProductOriginDto
            {
                Id = po.Id,
                ProductId = po.ProductId,
                OriginId = po.OriginId
            };
        }

        public class ProductOriginDto
        {
            public int Id { get; set; }
            public int ProductId { get; set; }
            public string? ProductName { get; set; }
            public int OriginId { get; set; }
            public string? OriginName { get; set; }
        }

        public class ProductOriginCreateDto
        {
            public int ProductId { get; set; }
            public int OriginId { get; set; }
        }

        public class ProductOriginUpdateDto
        {
            public int ProductId { get; set; }
            public int OriginId { get; set; }
        }
    }
}

