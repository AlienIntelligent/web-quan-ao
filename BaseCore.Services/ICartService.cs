using BaseCore.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public interface ICartService
    {
        Task<List<CartDetail>> GetCartItemsAsync(string userId);
        Task<CartDetail> AddToCartAsync(string userId, int productId, int quantity, decimal unitPrice);
        Task<CartDetail> UpdateCartItemAsync(string userId, int productId, int quantity);
        Task RemoveFromCartAsync(string userId, int productId);
        Task<decimal> GetCartTotalAsync(string userId);
        Task<int> GetCartItemCountAsync(string userId);
        Task ClearCartAsync(string userId);
        Task<(List<CartDetail> Items, decimal Total, int ItemCount)> GetCartWithDetailsAsync(string userId);
        Task<bool> IsProductInCartAsync(string userId, int productId);
    }
}
