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
        private readonly IRepository<ProductVariant> _variantRepository;
        private readonly AppDbContext _context;

        public CartService(
            ICartDetailRepository cartDetailRepository,
            IRepository<Product> productRepository,
            IRepository<ProductVariant> variantRepository,
            AppDbContext context)
        {
            _cartDetailRepository = cartDetailRepository;
            _productRepository = productRepository;
            _variantRepository = variantRepository;
            _context = context;
        }

        public async Task<List<CartDetail>> GetCartItemsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            var cartItems = await _cartDetailRepository.GetByUserIdAsync(userId);
            return cartItems;
        }

        public async Task<CartDetail> AddToCartAsync(string userId, int productId, int? variantId, int quantity, decimal unitPrice)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            if (quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0", nameof(quantity));

            // Check if product exists
            var product = await _productRepository.GetByIdAsync(productId);
            if (product == null)
                throw new InvalidOperationException($"Product with ID {productId} not found");

            var existingCartItem =
                await _cartDetailRepository.GetByUserProductAndVariantAsync(
                    userId,
                    productId,
                    variantId);

            // Check variant and stock
            if (variantId.HasValue)
            {
                var variant = await _variantRepository.GetByIdAsync(variantId.Value);
                if (variant == null || variant.ProductId != productId)
                    throw new InvalidOperationException("Invalid product variant");

                var requestedQuantity = quantity + (existingCartItem?.Quantity ?? 0);
                if (variant.Stock < requestedQuantity)
                    throw new InvalidOperationException($"Insufficient stock for variant. Available: {variant.Stock}");

                unitPrice = variant.Price;
            }
            else
            {
                var requestedQuantity = quantity + (existingCartItem?.Quantity ?? 0);
                if (product.Stock < requestedQuantity)
                    throw new InvalidOperationException($"Insufficient stock. Available: {product.Stock}");

                unitPrice = product.Price;
            }

            // Check if product already in cart (with same variant)
            if (existingCartItem != null)
            {
                existingCartItem.Quantity += quantity;
                existingCartItem.UpdatedAt = DateTime.UtcNow;
                await _cartDetailRepository.UpdateAsync(existingCartItem);
                return existingCartItem;
            }

            // Create new cart item
            var cartItem = new CartDetail
            {
                UserId = userId,
                ProductId = productId,
                VariantId = variantId,
                Quantity = quantity,
                UnitPrice = unitPrice,
                CreatedAt = DateTime.UtcNow
            };

            return await _cartDetailRepository.AddAsync(cartItem);
        }

        public async Task<CartDetail> UpdateCartItemAsync(string userId, int productId, int? variantId, int quantity)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            if (quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0", nameof(quantity));

            var cartItem = await _cartDetailRepository.GetByUserProductAndVariantAsync(userId, productId, variantId);
            if (cartItem == null)
                throw new InvalidOperationException($"Product variant not in cart");

            // Check stock
            if (variantId.HasValue)
            {
                var variant = await _variantRepository.GetByIdAsync(variantId.Value);
                if (variant.Stock < quantity)
                    throw new InvalidOperationException($"Insufficient stock for variant. Available: {variant.Stock}");
            }
            else
            {
                var product = await _productRepository.GetByIdAsync(productId);
                if (product.Stock < quantity)
                    throw new InvalidOperationException($"Insufficient stock. Available: {product.Stock}");
            }

            cartItem.Quantity = quantity;
            cartItem.UpdatedAt = DateTime.UtcNow;
            await _cartDetailRepository.UpdateAsync(cartItem);
            return cartItem;
        }

        public async Task RemoveFromCartAsync(string userId, int productId, int? variantId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            var cartItem = await _cartDetailRepository.GetByUserProductAndVariantAsync(userId, productId, variantId);
            if (cartItem == null)
                throw new InvalidOperationException($"Product variant not in cart");

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

        public async Task<List<CartDetail>> ReplaceCartAsync(
            string userId,
            List<(int ProductId, int? VariantId, int Quantity)> items)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            var normalizedItems = items
                .Where(item => item.ProductId > 0 && item.Quantity > 0)
                .GroupBy(item => new { item.ProductId, item.VariantId })
                .Select(group => (
                    group.Key.ProductId,
                    group.Key.VariantId,
                    Quantity: group.Sum(item => item.Quantity)))
                .ToList();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await _cartDetailRepository.ClearCartAsync(userId);

                foreach (var item in normalizedItems)
                {
                    await AddToCartAsync(
                        userId,
                        item.ProductId,
                        item.VariantId,
                        item.Quantity,
                        0);
                }

                await transaction.CommitAsync();
                return await _cartDetailRepository.GetByUserIdAsync(userId);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<(List<CartDetail> Items, decimal Total, int ItemCount)> GetCartWithDetailsAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            return await _cartDetailRepository.GetCartWithDetailsAsync(userId);
        }

        public async Task<bool> IsProductInCartAsync(string userId, int productId, int? variantId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID cannot be empty", nameof(userId));

            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            var cartItem = await _cartDetailRepository.GetByUserProductAndVariantAsync(userId, productId, variantId);
            return cartItem != null;
        }
    }
}
