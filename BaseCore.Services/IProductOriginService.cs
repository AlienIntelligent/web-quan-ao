using BaseCore.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public interface IProductOriginService
    {
        Task<List<ProductOrigin>> GetAllProductOriginsAsync();
        Task<ProductOrigin> GetProductOriginByIdAsync(int id);
        Task<ProductOrigin> GetProductOriginByProductIdAsync(int productId);
        Task<List<ProductOrigin>> GetProductOriginsByOriginIdAsync(int originId);
        Task<ProductOrigin> CreateProductOriginAsync(ProductOrigin productOrigin);
        Task UpdateProductOriginAsync(ProductOrigin productOrigin);
        Task DeleteProductOriginAsync(int id);
        Task<ProductOrigin?> GetProductOriginWithDetailsAsync(int productOriginId);
        Task SetProductOriginAsync(int productId, int originId);
        Task<bool> ProductHasOriginAsync(int productId);
        Task RemoveProductOriginAsync(int productId);
    }
}
