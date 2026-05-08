using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly IRepository<Category> _categoryRepository;

        public ProductService(IProductRepository productRepository, IRepository<Category> categoryRepository)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
        }

        public async Task<List<Product>> GetAllProductsAsync()
        {
            var products = await _productRepository.GetAllAsync();
            var productList = products.ToList();

            // Load categories manually if not using Include
            foreach (var product in productList)
            {
                product.Category = await _categoryRepository.GetByIdAsync(product.CategoryId);
            }

            return productList;
        }

        public async Task<Product> GetProductByIdAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);

            if (product != null)
            {
                product.Category = await _categoryRepository.GetByIdAsync(product.CategoryId);
            }

            return product;
        }

        public async Task<Product> CreateProductAsync(Product product)
        {
            return await _productRepository.AddAsync(product);
        }

        public async Task UpdateProductAsync(Product product)
        {
            await _productRepository.UpdateAsync(product);
        }

        public async Task DeleteProductAsync(int id)
        {
            await _productRepository.DeleteByIdAsync(id);
        }

        public async Task<(List<Product> Products, int TotalCount)> SearchAsync(string keyword, int? categoryId, decimal? minPrice, decimal? maxPrice, int? sizeId, int? colorId, int page, int pageSize)
        {
            return await _productRepository.SearchAsync(keyword, categoryId, minPrice, maxPrice, sizeId, colorId, page, pageSize);
        }
    }
}
