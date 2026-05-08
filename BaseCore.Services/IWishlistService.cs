using BaseCore.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public interface IWishlistService
    {
        Task<List<WishlistItem>> GetWishlistItemsAsync(string userId);
        Task<WishlistItem> AddToWishlistAsync(string userId, int productId, int? variantId);
        Task RemoveFromWishlistAsync(string userId, int productId, int? variantId);
        Task<int> GetWishlistItemCountAsync(string userId);
        Task ClearWishlistAsync(string userId);
        Task<bool> IsProductInWishlistAsync(string userId, int productId, int? variantId);
    }
}
