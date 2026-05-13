using BaseCore.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public interface IPromotionService
    {
        Task<List<Promotion>> GetAllPromotionsAsync();
        Task<Promotion> GetPromotionByIdAsync(int id);
        Task<Promotion> GetPromotionByCodeAsync(string code);
        Task<List<Promotion>> GetActivePromotionsAsync();
        Task<List<Promotion>> GetPromotionsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<Promotion> CreatePromotionAsync(Promotion promotion);
        Task UpdatePromotionAsync(Promotion promotion);
        Task DeletePromotionAsync(int id);
        Task<(List<Promotion> Promotions, int TotalCount)> SearchAsync(
            string? keyword,
            bool? isActive,
            string? discountType,
            decimal? discountValue,
            decimal? minimumOrderAmount,
            int page,
            int pageSize);
        Task<Promotion?> GetPromotionWithProductsAsync(int promotionId);
        Task<PromotionApplicationResult> ApplyPromotionAsync(string code, decimal orderSubtotal, decimal shippingFee);
    }

    public class PromotionApplicationResult
    {
        public Promotion Promotion { get; set; } = null!;
        public decimal DiscountAmount { get; set; }
        public decimal FinalTotal { get; set; }
        public string Message { get; set; } = "";
    }
}
