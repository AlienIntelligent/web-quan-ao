using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class CartService : ICartService
    {
        private readonly ICartDetailRepository _cartDetailRepository;
        private readonly IRepository<Product> _productRepository;

        public CartService(
            ICartDetailRepository cartDetailRepository,
            IRepository<Product> productRepository)
        {
            _cartDetailRepository = cartDetailRepository;
            _productRepository = productRepository;
        }

        public async Task<List<CartDetail>> GetCartItemsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            var cartItems = await _cartDetailRepository.GetByUserIdAsync(userId);
            return cartItems;
        }

        public async Task<CartDetail> AddToCartAsync(string userId, int productId, int quantity, decimal unitPrice)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            if (quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0", nameof(quantity));

            if (unitPrice < 0)
                throw new ArgumentException("Unit price cannot be negative", nameof(unitPrice));

            // Check if product exists
            var product = await _productRepository.GetByIdAsync(productId);
            if (product == null)
                throw new InvalidOperationException($"Product with ID {productId} not found");

            // Check stock
            if (product.Stock < quantity)
                throw new InvalidOperationException($"Insufficient stock. Available: {product.Stock}");

            // Check if product already in cart
            var existingCartItem = await _cartDetailRepository.GetByUserAndProductAsync(userId, productId);
            if (existingCartItem != null)
            {
                existingCartItem.Quantity += quantity;
                await _cartDetailRepository.UpdateAsync(existingCartItem);
                return existingCartItem;
            }

            // Create new cart item
            var cartItem = new CartDetail
            {
                UserId = userId,
                ProductId = productId,
                Quantity = quantity,
                UnitPrice = unitPrice,
                CreatedAt = DateTime.UtcNow
            };

            return await _cartDetailRepository.AddAsync(cartItem);
        }

        public async Task<CartDetail> UpdateCartItemAsync(string userId, int productId, int quantity)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            if (quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0", nameof(quantity));

            var cartItem = await _cartDetailRepository.GetByUserAndProductAsync(userId, productId);
            if (cartItem == null)
                throw new InvalidOperationException($"Product not in cart");

            // Check stock
            var product = await _productRepository.GetByIdAsync(productId);
            if (product.Stock < quantity)
                throw new InvalidOperationException($"Insufficient stock. Available: {product.Stock}");

            cartItem.Quantity = quantity;
            cartItem.UpdatedAt = DateTime.UtcNow;
            await _cartDetailRepository.UpdateAsync(cartItem);
            return cartItem;
        }

        public async Task RemoveFromCartAsync(string userId, int productId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            var cartItem = await _cartDetailRepository.GetByUserAndProductAsync(userId, productId);
            if (cartItem == null)
                throw new InvalidOperationException($"Product not in cart");

            await _cartDetailRepository.DeleteAsync(cartItem);
        }

        public async Task<decimal> GetCartTotalAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            return await _cartDetailRepository.GetCartTotalAsync(userId);
        }

        public async Task<int> GetCartItemCountAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            return await _cartDetailRepository.GetCartItemCountAsync(userId);
        }

        public async Task ClearCartAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            await _cartDetailRepository.ClearCartAsync(userId);
        }

        public async Task<(List<CartDetail> Items, decimal Total, int ItemCount)> GetCartWithDetailsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            return await _cartDetailRepository.GetCartWithDetailsAsync(userId);
        }

        public async Task<bool> IsProductInCartAsync(string userId, int productId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            var cartItem = await _cartDetailRepository.GetByUserAndProductAsync(userId, productId);
            return cartItem != null;
        }
    }
}
