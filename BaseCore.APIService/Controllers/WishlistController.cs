using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Services;
using System.Security.Claims;
using System.Threading.Tasks;
using System;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistService _wishlistService;

        public WishlistController(IWishlistService wishlistService)
        {
            _wishlistService = wishlistService;
        }

        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var items = await _wishlistService.GetWishlistItemsAsync(userId);
            return Ok(items);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToWishlist([FromBody] WishlistDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                var item = await _wishlistService.AddToWishlistAsync(userId, dto.ProductId, dto.VariantId);
                return Ok(item);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("remove")]
        public async Task<IActionResult> RemoveFromWishlist([FromQuery] int productId, [FromQuery] int? variantId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                await _wishlistService.RemoveFromWishlistAsync(userId, productId, variantId);
                return Ok(new { message = "Item removed from wishlist" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("check")]
        public async Task<IActionResult> CheckWishlist([FromQuery] int productId, [FromQuery] int? variantId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var exists = await _wishlistService.IsProductInWishlistAsync(userId, productId, variantId);
            return Ok(new { exists });
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearWishlist()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            await _wishlistService.ClearWishlistAsync(userId);
            return Ok(new { message = "Wishlist cleared" });
        }
    }

    public class WishlistDto
    {
        public int ProductId { get; set; }
        public int? VariantId { get; set; }
    }
}
