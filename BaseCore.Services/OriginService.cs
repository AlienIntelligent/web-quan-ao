using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class OriginService : IOriginService
    {
        private readonly IOriginRepository _originRepository;

        public OriginService(IOriginRepository originRepository)
        {
            _originRepository = originRepository;
        }

        public async Task<List<Origin>> GetAllOriginsAsync()
        {
            var origins = await _originRepository.GetAllAsync();
            return origins.ToList();
        }

        public async Task<Origin> GetOriginByIdAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid origin ID", nameof(id));

            var origin = await _originRepository.GetByIdAsync(id);
            if (origin == null)
                throw new InvalidOperationException($"Origin with ID {id} not found");

            return origin;
        }

        public async Task<Origin> GetOriginByNameAsync(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Origin name cannot be empty", nameof(name));

            var origin = await _originRepository.GetByNameAsync(name);
            if (origin == null)
                throw new InvalidOperationException($"Origin with name '{name}' not found");

            return origin;
        }

        public async Task<List<Origin>> GetActiveOriginsAsync()
        {
            var origins = await _originRepository.GetActiveOriginsAsync();
            return origins;
        }

        public async Task<Origin> CreateOriginAsync(Origin origin)
        {
            if (origin == null)
                throw new ArgumentNullException(nameof(origin));

            if (string.IsNullOrWhiteSpace(origin.Name))
                throw new ArgumentException("Origin name is required", nameof(origin.Name));

            // Check for duplicate name
            var existingOrigin = await _originRepository.GetByNameAsync(origin.Name);
            if (existingOrigin != null)
                throw new InvalidOperationException($"Origin with name '{origin.Name}' already exists");

            origin.CreatedAt = DateTime.UtcNow;
            origin.IsActive = true;
            return await _originRepository.AddAsync(origin);
        }

        public async Task UpdateOriginAsync(Origin origin)
        {
            if (origin == null)
                throw new ArgumentNullException(nameof(origin));

            if (origin.Id <= 0)
                throw new ArgumentException("Invalid origin ID", nameof(origin.Id));

            var existingOrigin = await _originRepository.GetByIdAsync(origin.Id);
            if (existingOrigin == null)
                throw new InvalidOperationException($"Origin with ID {origin.Id} not found");

            await _originRepository.UpdateAsync(origin);
        }

        public async Task DeleteOriginAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid origin ID", nameof(id));

            var origin = await _originRepository.GetByIdAsync(id);
            if (origin == null)
                throw new InvalidOperationException($"Origin with ID {id} not found");

            await _originRepository.DeleteByIdAsync(id);
        }

        public async Task<(List<Origin> Origins, int TotalCount)> SearchAsync(string? keyword, bool? isActive, int page, int pageSize)
        {
            if (page < 1)
                throw new ArgumentException("Page number must be greater than 0", nameof(page));

            if (pageSize < 1 || pageSize > 100)
                throw new ArgumentException("Page size must be between 1 and 100", nameof(pageSize));

            var result = await _originRepository.SearchAsync(keyword, isActive, page, pageSize);
            return result;
        }

        public async Task<Origin?> GetOriginWithProductsAsync(int originId)
        {
            if (originId <= 0)
                throw new ArgumentException("Invalid origin ID", nameof(originId));

            var origin = await _originRepository.GetWithProductsAsync(originId);
            return origin;
        }
    }
}
