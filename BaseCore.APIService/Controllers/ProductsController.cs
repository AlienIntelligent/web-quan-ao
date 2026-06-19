using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Linq;

namespace BaseCore.APIService.Controllers
{
    /// <summary>
    /// Product API Controller
    /// Teaching: RESTful API, CRUD Operations, EF Core (Bài 10, 11)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _productRepository;
        private readonly ICategoryRepository _categoryRepository;

        public ProductsController(IProductRepository productRepository, ICategoryRepository categoryRepository)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
        }

        /// <summary>
        /// Get all products with pagination and search
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int? categoryId,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] int? sizeId,
            [FromQuery] int? colorId,
            [FromQuery] string? sortBy,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);
            keyword = string.IsNullOrWhiteSpace(keyword) ? null : keyword.Trim();

            if (minPrice < 0 || maxPrice < 0)
                return BadRequest(new { message = "Khoảng giá không được là số âm." });

            if (minPrice.HasValue && maxPrice.HasValue && minPrice > maxPrice)
                return BadRequest(new { message = "Giá từ không được lớn hơn giá đến." });

            var (products, totalCount) = await _productRepository.SearchAsync(
                keyword,
                categoryId,
                minPrice,
                maxPrice,
                sizeId,
                colorId,
                sortBy,
                page,
                pageSize);
            var soldCounts = await _productRepository.GetSoldCountsAsync(products.Select(product => product.Id));

            // IMPORTANT:
            // Trả DTO/projection để tránh vòng tham chiếu khi serialize entity (Product <-> Category).
            // UI quản trị cần product.category?.name, nên chỉ map đúng phần đó.
            var items = products.Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                OriginalPrice = p.OriginalPrice,
                Stock = p.Stock,
                ImageUrl = p.ImageUrl,
                Description = p.Description,
                CategoryId = p.CategoryId,
                Category = p.Category == null
                    ? null
                    : new CategoryBriefDto
                    {
                        Id = p.Category.Id,
                        Name = p.Category.Name,
                        Description = p.Category.Description
                    },
                OriginName = p.ProductOrigin?.Origin?.Name,
                VariantCount = p.ProductVariants?.Count ?? 0,
                TotalStock = p.ProductVariants != null && p.ProductVariants.Any()
                    ? p.ProductVariants.Sum(v => v.Stock)
                    : p.Stock,
                SoldCount = soldCounts.GetValueOrDefault(p.Id)
            }).ToList();

            return Ok(new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        /// <summary>
        /// Get product by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });
            var soldCounts = await _productRepository.GetSoldCountsAsync(new[] { id });

            var dto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Price = product.Price,
                OriginalPrice = product.OriginalPrice,
                Stock = product.Stock,
                ImageUrl = product.ImageUrl,
                Description = product.Description,
                CategoryId = product.CategoryId,
                Category = product.Category == null
                    ? null
                    : new CategoryBriefDto
                    {
                        Id = product.Category.Id,
                        Name = product.Category.Name,
                        Description = product.Category.Description
                    },
                OriginName = product.ProductOrigin?.Origin?.Name,
                VariantCount = product.ProductVariants?.Count ?? 0,
                TotalStock = product.ProductVariants != null && product.ProductVariants.Any()
                    ? product.ProductVariants.Sum(v => v.Stock)
                    : product.Stock,
                SoldCount = soldCounts.GetValueOrDefault(product.Id)
            };

            return Ok(dto);
        }

        /// <summary>
        /// Create new product (requires authentication)
        /// </summary>
        [HttpPost]
        [Authorize (Roles = "Admin")] // Chỉ admin mới được tạo sản phẩm mới
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            // Validate category exists
            var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Category not found" });
            if (dto.Stock < 0)
                return BadRequest(new { message = "Stock cannot be negative" });
            if (dto.Price < 0 || (dto.OriginalPrice.HasValue && dto.OriginalPrice.Value < 0))
                return BadRequest(new { message = "Price cannot be negative" });

            var product = new Product
            {
                Name = dto.Name,
                Price = dto.Price,
                OriginalPrice = dto.OriginalPrice,
                Stock = dto.Stock,
                CategoryId = dto.CategoryId,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl ?? ""
            };

            await _productRepository.AddAsync(product);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        /// <summary>
        /// Update product (requires authentication)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });
            if (dto.Stock.HasValue && dto.Stock.Value < 0)
                return BadRequest(new { message = "Stock cannot be negative" });
            if ((dto.Price.HasValue && dto.Price.Value < 0) ||
                (dto.OriginalPrice.HasValue && dto.OriginalPrice.Value < 0))
                return BadRequest(new { message = "Price cannot be negative" });

            product.Name = dto.Name ?? product.Name;
            product.Price = dto.Price ?? product.Price;
            product.OriginalPrice = dto.OriginalPrice ?? product.OriginalPrice;
            product.Stock = dto.Stock ?? product.Stock;
            product.CategoryId = dto.CategoryId ?? product.CategoryId;
            product.Description = dto.Description ?? product.Description;
            product.ImageUrl = dto.ImageUrl ?? product.ImageUrl;

            await _productRepository.UpdateAsync(product);
            return Ok(product);
        }

        /// <summary>
        /// Delete product (requires authentication)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            await _productRepository.DeleteAsync(product);
            return Ok(new { message = "Product deleted successfully" });
        }

        /// <summary>
        /// Get products by category
        /// </summary>
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _productRepository.GetByCategoryAsync(categoryId);
            return Ok(products);
        }
    }

    // DTOs
    public class ProductCreateDto
    {
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public int Stock { get; set; }
        public int CategoryId { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class ProductUpdateDto
    {
        public string? Name { get; set; }
        public decimal? Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public int? Stock { get; set; }
        public int? CategoryId { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
    }

    // DTO dùng cho response để tránh vòng tham chiếu khi serialize entity.
    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public int Stock { get; set; }
        public string ImageUrl { get; set; } = "";
        public string Description { get; set; } = "";
        public int CategoryId { get; set; }
        public CategoryBriefDto? Category { get; set; }
        public string? OriginName { get; set; }
        public int VariantCount { get; set; }
        public int TotalStock { get; set; }
        public int SoldCount { get; set; }
    }

    public class CategoryBriefDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
    }
}


