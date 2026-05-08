using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class WishlistService : IWishlistService
    {
        private readonly IWishlistItemRepository _wishlistRepository;
        private readonly IRepository<Product> _productRepository;

        public WishlistService(
            IWishlistItemRepository wishlistRepository,
            IRepository<Product> productRepository)
        {
            _wishlistRepository = wishlistRepository;
            _productRepository = productRepository;
        }

        public async Task<List<WishlistItem>> GetWishlistItemsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            return await _wishlistRepository.GetByUserIdAsync(userId);
        }

        public async Task<WishlistItem> AddToWishlistAsync(string userId, int productId, int? variantId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            // Check if product exists
            var product = await _productRepository.GetByIdAsync(productId);
            if (product == null)
                throw new InvalidOperationException($"Product with ID {productId} not found");

            // Check if already in wishlist
            var existingItem = await _wishlistRepository.GetByUserProductAndVariantAsync(userId, productId, variantId);
            if (existingItem != null)
                return existingItem;

            var item = new WishlistItem
            {
                UserId = userId,
                ProductId = productId,
                VariantId = variantId,
                CreatedAt = DateTime.UtcNow
            };

            return await _wishlistRepository.AddAsync(item);
        }

        public async Task RemoveFromWishlistAsync(string userId, int productId, int? variantId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            var item = await _wishlistRepository.GetByUserProductAndVariantAsync(userId, productId, variantId);
            if (item != null)
            {
                await _wishlistRepository.DeleteAsync(item);
            }
        }

        public async Task<int> GetWishlistItemCountAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return 0;

            return await _wishlistRepository.GetWishlistItemCountAsync(userId);
        }

        public async Task ClearWishlistAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return;

            await _wishlistRepository.ClearWishlistAsync(userId);
        }

        public async Task<bool> IsProductInWishlistAsync(string userId, int productId, int? variantId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return false;

            var item = await _wishlistRepository.GetByUserProductAndVariantAsync(userId, productId, variantId);
            return item != null;
        }
    }
}
