using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    [Route("api/origins")]
    [ApiController]
    [Authorize]
    public class OriginsController : ControllerBase
    {
        private readonly IOriginService _originService;

        public OriginsController(IOriginService originService)
        {
            _originService = originService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string keyword = "",
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (origins, totalCount) = await _originService.SearchAsync(
                string.IsNullOrWhiteSpace(keyword) ? null : keyword,
                isActive,
                page,
                pageSize);

            var items = origins.Select(o => new OriginDto
            {
                Id = o.Id,
                Name = o.Name,
                Description = o.Description,
                IsActive = o.IsActive,
                CreatedAt = o.CreatedAt
            }).ToList();

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
            try
            {
                var origin = await _originService.GetOriginByIdAsync(id);
                return Ok(ToDto(origin));
            }
            catch
            {
                return NotFound(new { message = "Origin not found" });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] OriginCreateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            var origin = new Origin
            {
                Name = dto.Name ?? "",
                Description = dto.Description,
                IsActive = dto.IsActive ?? true
            };

            var created = await _originService.CreateOriginAsync(origin);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] OriginUpdateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            Origin existing;
            try
            {
                existing = await _originService.GetOriginByIdAsync(id);
            }
            catch
            {
                return NotFound(new { message = "Origin not found" });
            }

            existing.Name = dto.Name ?? existing.Name;
            existing.Description = dto.Description ?? existing.Description;
            existing.IsActive = dto.IsActive ?? existing.IsActive;

            await _originService.UpdateOriginAsync(existing);
            return Ok(ToDto(existing));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            try
            {
                await _originService.DeleteOriginAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private static OriginDto ToDto(Origin o)
        {
            return new OriginDto
            {
                Id = o.Id,
                Name = o.Name,
                Description = o.Description,
                IsActive = o.IsActive,
                CreatedAt = o.CreatedAt
            };
        }

        public class OriginDto
        {
            public int Id { get; set; }
            public string Name { get; set; } = "";
            public string? Description { get; set; }
            public bool IsActive { get; set; }
            public DateTime CreatedAt { get; set; }
        }

        public class OriginCreateDto
        {
            public string? Name { get; set; }
            public string? Description { get; set; }
            public bool? IsActive { get; set; }
        }

        public class OriginUpdateDto
        {
            public string? Name { get; set; }
            public string? Description { get; set; }
            public bool? IsActive { get; set; }
        }
    }
}

