using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    [Route("api/shippings")]
    [ApiController]
    [Authorize]
    public class ShippingsController : ControllerBase
    {
        private readonly IShippingService _shippingService;

        public ShippingsController(IShippingService shippingService)
        {
            _shippingService = shippingService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status = null,
            [FromQuery] string? carrierName = null,
            [FromQuery] string? keyword = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (shippings, totalCount) = await _shippingService.SearchAsync(
                string.IsNullOrWhiteSpace(status) ? null : status,
                string.IsNullOrWhiteSpace(carrierName) ? null : carrierName,
                string.IsNullOrWhiteSpace(keyword) ? null : keyword,
                page,
                pageSize);

            var items = shippings.Select(s => ToDto(s)).ToList();

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
                var shipping = await _shippingService.GetShippingByIdAsync(id);
                return Ok(ToDto(shipping));
            }
            catch
            {
                return NotFound(new { message = "Shipping not found" });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] ShippingCreateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            var shipping = new Shipping
            {
                OrderId = dto.OrderId,
                ReceiverName = dto.ReceiverName ?? "",
                ReceiverPhone = dto.ReceiverPhone ?? "",
                ShippingAddress = dto.ShippingAddress ?? "",
                ShippingMethod = dto.ShippingMethod ?? "",
                ShippingStatus = dto.ShippingStatus ?? "",
                ShippingFee = dto.ShippingFee,
                ShippedDate = dto.ShippedDate,
                EstimatedDeliveryDate = dto.EstimatedDeliveryDate,
                DeliveredDate = dto.DeliveredDate,
                TrackingCode = dto.TrackingCode,
                CarrierName = dto.CarrierName,
                Note = dto.Note
            };

            var created = await _shippingService.CreateShippingAsync(shipping);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] ShippingUpdateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Invalid request" });

            try
            {
                var existing = await _shippingService.GetShippingByIdAsync(id);

                existing.OrderId = dto.OrderId ?? existing.OrderId;
                existing.ReceiverName = dto.ReceiverName ?? existing.ReceiverName;
                existing.ReceiverPhone = dto.ReceiverPhone ?? existing.ReceiverPhone;
                existing.ShippingAddress = dto.ShippingAddress ?? existing.ShippingAddress;
                existing.ShippingMethod = dto.ShippingMethod ?? existing.ShippingMethod;
                existing.ShippingStatus = dto.ShippingStatus ?? existing.ShippingStatus;
                existing.ShippingFee = dto.ShippingFee ?? existing.ShippingFee;
                existing.ShippedDate = dto.ShippedDate ?? existing.ShippedDate;
                existing.EstimatedDeliveryDate = dto.EstimatedDeliveryDate ?? existing.EstimatedDeliveryDate;
                existing.DeliveredDate = dto.DeliveredDate ?? existing.DeliveredDate;
                existing.TrackingCode = dto.TrackingCode ?? existing.TrackingCode;
                existing.CarrierName = dto.CarrierName ?? existing.CarrierName;
                existing.Note = dto.Note ?? existing.Note;

                await _shippingService.UpdateShippingAsync(existing);
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
                await _shippingService.DeleteShippingAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/confirm")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ConfirmShipment([FromRoute] int id)
        {
            try
            {
                var shipping = await _shippingService.ConfirmShipmentAsync(id);
                return Ok(new { message = "Xác nhận chuyển đơn thành công. Đơn hàng đã được cập nhật sang trạng thái 'Đã chuyển'.", shipping = ToDto(shipping) });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private static ShippingDto ToDto(Shipping s)
        {
            return new ShippingDto
            {
                Id = s.Id,
                OrderId = s.OrderId,
                ReceiverName = s.ReceiverName,
                ReceiverPhone = s.ReceiverPhone,
                ShippingAddress = s.ShippingAddress,
                ShippingMethod = s.ShippingMethod,
                ShippingStatus = s.ShippingStatus,
                ShippingFee = s.ShippingFee,
                ShippedDate = s.ShippedDate,
                EstimatedDeliveryDate = s.EstimatedDeliveryDate,
                DeliveredDate = s.DeliveredDate,
                TrackingCode = s.TrackingCode,
                CarrierName = s.CarrierName,
                Note = s.Note
            };
        }

        public class ShippingDto
        {
            public int Id { get; set; }
            public int OrderId { get; set; }
            public string ReceiverName { get; set; } = "";
            public string ReceiverPhone { get; set; } = "";
            public string ShippingAddress { get; set; } = "";
            public string ShippingMethod { get; set; } = "";
            public string ShippingStatus { get; set; } = "";
            public decimal ShippingFee { get; set; }
            public DateTime? ShippedDate { get; set; }
            public DateTime? EstimatedDeliveryDate { get; set; }
            public DateTime? DeliveredDate { get; set; }
            public string? TrackingCode { get; set; }
            public string? CarrierName { get; set; }
            public string? Note { get; set; }
        }

        public class ShippingCreateDto
        {
            public int OrderId { get; set; }
            public string? ReceiverName { get; set; }
            public string? ReceiverPhone { get; set; }
            public string? ShippingAddress { get; set; }
            public string? ShippingMethod { get; set; }
            public string? ShippingStatus { get; set; }
            public decimal ShippingFee { get; set; }
            public DateTime? ShippedDate { get; set; }
            public DateTime? EstimatedDeliveryDate { get; set; }
            public DateTime? DeliveredDate { get; set; }
            public string? TrackingCode { get; set; }
            public string? CarrierName { get; set; }
            public string? Note { get; set; }
        }

        public class ShippingUpdateDto
        {
            public int? OrderId { get; set; }
            public string? ReceiverName { get; set; }
            public string? ReceiverPhone { get; set; }
            public string? ShippingAddress { get; set; }
            public string? ShippingMethod { get; set; }
            public string? ShippingStatus { get; set; }
            public decimal? ShippingFee { get; set; }
            public DateTime? ShippedDate { get; set; }
            public DateTime? EstimatedDeliveryDate { get; set; }
            public DateTime? DeliveredDate { get; set; }
            public string? TrackingCode { get; set; }
            public string? CarrierName { get; set; }
            public string? Note { get; set; }
        }
    }
}

