using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    [Route("api/order-details")]
    [ApiController]
    [Authorize]
    public class OrderDetailsController : ControllerBase
    {
        private readonly IOrderDetailRepository _orderDetailRepository;
        private readonly IProductRepository _productRepository;

        public OrderDetailsController(
            IOrderDetailRepository orderDetailRepository,
            IProductRepository productRepository)
        {
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string keyword = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            Expression<Func<OrderDetail, bool>>? filter = null;
            if (!string.IsNullOrWhiteSpace(keyword) && int.TryParse(keyword, out var n) && n > 0)
            {
                filter = od => od.OrderId == n || od.ProductId == n;
            }

            Expression<Func<OrderDetail, object>> orderBy = od => (object)od.Id;

            var (items, totalCount) = await _orderDetailRepository.GetPagedAsync(
                page,
                pageSize,
                filter,
                orderBy,
                descending: true);

            var dtoItems = new List<OrderDetailDto>();
            foreach (var od in items)
            {
                var product = await _productRepository.GetByIdAsync(od.ProductId);
                dtoItems.Add(new OrderDetailDto
                {
                    Id = od.Id,
                    OrderId = od.OrderId,
                    ProductId = od.ProductId,
                    ProductName = product?.Name,
                    Quantity = od.Quantity,
                    UnitPrice = od.UnitPrice
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
            var od = await _orderDetailRepository.GetByIdAsync(id);
            if (od == null)
                return NotFound(new { message = "Order detail not found" });

            var product = await _productRepository.GetByIdAsync(od.ProductId);

            return Ok(new OrderDetailDto
            {
                Id = od.Id,
                OrderId = od.OrderId,
                ProductId = od.ProductId,
                ProductName = product?.Name,
                Quantity = od.Quantity,
                UnitPrice = od.UnitPrice
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] OrderDetailCreateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            var od = new OrderDetail
            {
                OrderId = dto.OrderId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice
            };

            try
            {
                var created = await _orderDetailRepository.AddAsync(od);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created.Id);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] OrderDetailUpdateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            var existing = await _orderDetailRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Order detail not found" });

            existing.OrderId = dto.OrderId ?? existing.OrderId;
            existing.ProductId = dto.ProductId ?? existing.ProductId;
            existing.Quantity = dto.Quantity ?? existing.Quantity;
            existing.UnitPrice = dto.UnitPrice ?? existing.UnitPrice;

            try
            {
                await _orderDetailRepository.UpdateAsync(existing);
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
                await _orderDetailRepository.DeleteByIdAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class OrderDetailDto
        {
            public int Id { get; set; }
            public int OrderId { get; set; }
            public int ProductId { get; set; }
            public string? ProductName { get; set; }
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
        }

        public class OrderDetailCreateDto
        {
            public int OrderId { get; set; }
            public int ProductId { get; set; }
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
        }

        public class OrderDetailUpdateDto
        {
            public int? OrderId { get; set; }
            public int? ProductId { get; set; }
            public int? Quantity { get; set; }
            public decimal? UnitPrice { get; set; }
        }
    }
}

