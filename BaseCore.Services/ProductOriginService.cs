using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class ProductOriginService : IProductOriginService
    {
        private readonly IProductOriginRepository _productOriginRepository;
        private readonly IRepository<Product> _productRepository;
        private readonly IOriginRepository _originRepository;

        public ProductOriginService(
            IProductOriginRepository productOriginRepository,
            IRepository<Product> productRepository,
            IOriginRepository originRepository)
        {
            _productOriginRepository = productOriginRepository;
            _productRepository = productRepository;
            _originRepository = originRepository;
        }

        public async Task<List<ProductOrigin>> GetAllProductOriginsAsync()
        {
            var productOrigins = await _productOriginRepository.GetAllAsync();
            return productOrigins.ToList();
        }

        public async Task<ProductOrigin> GetProductOriginByIdAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid product origin ID", nameof(id));

            var productOrigin = await _productOriginRepository.GetByIdAsync(id);
            if (productOrigin == null)
                throw new InvalidOperationException($"Product origin with ID {id} not found");

            return productOrigin;
        }

        public async Task<ProductOrigin> GetProductOriginByProductIdAsync(int productId)
        {
            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            // Verify product exists
            var product = await _productRepository.GetByIdAsync(productId);
            if (product == null)
                throw new InvalidOperationException($"Product with ID {productId} not found");

            var productOrigin = await _productOriginRepository.GetByProductIdAsync(productId);
            if (productOrigin == null)
                throw new InvalidOperationException($"No origin assigned to product {productId}");

            return productOrigin;
        }

        public async Task<List<ProductOrigin>> GetProductOriginsByOriginIdAsync(int originId)
        {
            if (originId <= 0)
                throw new ArgumentException("Invalid origin ID", nameof(originId));

            // Verify origin exists
            var origin = await _originRepository.GetByIdAsync(originId);
            if (origin == null)
                throw new InvalidOperationException($"Origin with ID {originId} not found");

            var productOrigins = await _productOriginRepository.GetByOriginIdAsync(originId);
            return productOrigins;
        }

        public async Task<ProductOrigin> CreateProductOriginAsync(ProductOrigin productOrigin)
        {
            if (productOrigin == null)
                throw new ArgumentNullException(nameof(productOrigin));

            if (productOrigin.ProductId <= 0)
                throw new ArgumentException("Valid product ID is required", nameof(productOrigin.ProductId));

            if (productOrigin.OriginId <= 0)
                throw new ArgumentException("Valid origin ID is required", nameof(productOrigin.OriginId));

            // Verify product exists
            var product = await _productRepository.GetByIdAsync(productOrigin.ProductId);
            if (product == null)
                throw new InvalidOperationException($"Product with ID {productOrigin.ProductId} not found");

            // Verify origin exists
            var origin = await _originRepository.GetByIdAsync(productOrigin.OriginId);
            if (origin == null)
                throw new InvalidOperationException($"Origin with ID {productOrigin.OriginId} not found");

            // Check if product already has an origin assigned
            var existingProductOrigin = await _productOriginRepository.GetByProductIdAsync(productOrigin.ProductId);
            if (existingProductOrigin != null)
                throw new InvalidOperationException($"Product {productOrigin.ProductId} already has an origin assigned");

            return await _productOriginRepository.AddAsync(productOrigin);
        }

        public async Task UpdateProductOriginAsync(ProductOrigin productOrigin)
        {
            if (productOrigin == null)
                throw new ArgumentNullException(nameof(productOrigin));

            if (productOrigin.Id <= 0)
                throw new ArgumentException("Invalid product origin ID", nameof(productOrigin.Id));

            var existingProductOrigin = await _productOriginRepository.GetByIdAsync(productOrigin.Id);
            if (existingProductOrigin == null)
                throw new InvalidOperationException($"Product origin with ID {productOrigin.Id} not found");

            // If origin is being changed, verify new origin exists
            if (existingProductOrigin.OriginId != productOrigin.OriginId)
            {
                var origin = await _originRepository.GetByIdAsync(productOrigin.OriginId);
                if (origin == null)
                    throw new InvalidOperationException($"Origin with ID {productOrigin.OriginId} not found");
            }

            await _productOriginRepository.UpdateAsync(productOrigin);
        }

        public async Task DeleteProductOriginAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid product origin ID", nameof(id));

            var productOrigin = await _productOriginRepository.GetByIdAsync(id);
            if (productOrigin == null)
                throw new InvalidOperationException($"Product origin with ID {id} not found");

            await _productOriginRepository.DeleteByIdAsync(id);
        }

        public async Task<ProductOrigin?> GetProductOriginWithDetailsAsync(int productOriginId)
        {
            if (productOriginId <= 0)
                throw new ArgumentException("Invalid product origin ID", nameof(productOriginId));

            var productOrigin = await _productOriginRepository.GetWithDetailsAsync(productOriginId);
            return productOrigin;
        }

        public async Task SetProductOriginAsync(int productId, int originId)
        {
            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            if (originId <= 0)
                throw new ArgumentException("Invalid origin ID", nameof(originId));

            // Verify product exists
            var product = await _productRepository.GetByIdAsync(productId);
            if (product == null)
                throw new InvalidOperationException($"Product with ID {productId} not found");

            // Verify origin exists
            var origin = await _originRepository.GetByIdAsync(originId);
            if (origin == null)
                throw new InvalidOperationException($"Origin with ID {originId} not found");

            // Check if product already has an origin
            var existingProductOrigin = await _productOriginRepository.GetByProductIdAsync(productId);

            if (existingProductOrigin != null)
            {
                // Update existing
                existingProductOrigin.OriginId = originId;
                await _productOriginRepository.UpdateAsync(existingProductOrigin);
            }
            else
            {
                // Create new
                var productOrigin = new ProductOrigin
                {
                    ProductId = productId,
                    OriginId = originId
                };
                await _productOriginRepository.AddAsync(productOrigin);
            }
        }

        public async Task<bool> ProductHasOriginAsync(int productId)
        {
            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            var productOrigin = await _productOriginRepository.GetByProductIdAsync(productId);
            return productOrigin != null;
        }

        public async Task RemoveProductOriginAsync(int productId)
        {
            if (productId <= 0)
                throw new ArgumentException("Invalid product ID", nameof(productId));

            var productOrigin = await _productOriginRepository.GetByProductIdAsync(productId);
            if (productOrigin == null)
                throw new InvalidOperationException($"No origin assigned to product {productId}");

            await _productOriginRepository.DeleteAsync(productOrigin);
        }
    }
}
