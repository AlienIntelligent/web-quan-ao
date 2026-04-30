using BaseCore.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public interface IOriginService
    {
        Task<List<Origin>> GetAllOriginsAsync();
        Task<Origin> GetOriginByIdAsync(int id);
        Task<Origin> GetOriginByNameAsync(string name);
        Task<List<Origin>> GetActiveOriginsAsync();
        Task<Origin> CreateOriginAsync(Origin origin);
        Task UpdateOriginAsync(Origin origin);
        Task DeleteOriginAsync(int id);
        Task<(List<Origin> Origins, int TotalCount)> SearchAsync(string? keyword, bool? isActive, int page, int pageSize);
        Task<Origin?> GetOriginWithProductsAsync(int originId);
    }
}
