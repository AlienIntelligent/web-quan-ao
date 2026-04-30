using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class PromotionService : IPromotionService
    {
        private readonly IPromotionRepository _promotionRepository;

        public PromotionService(IPromotionRepository promotionRepository)
        {
            _promotionRepository = promotionRepository;
        }

        public async Task<List<Promotion>> GetAllPromotionsAsync()
        {
            var promotions = await _promotionRepository.GetAllAsync();
            return promotions.ToList();
        }

        public async Task<Promotion> GetPromotionByIdAsync(int id)
        {
            var promotion = await _promotionRepository.GetByIdAsync(id);
            return promotion;
        }

        public async Task<Promotion> GetPromotionByCodeAsync(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                throw new ArgumentException("Promotion code cannot be empty", nameof(code));

            var promotion = await _promotionRepository.GetByCodeAsync(code);
            return promotion;
        }

        public async Task<List<Promotion>> GetActivePromotionsAsync()
        {
            var promotions = await _promotionRepository.GetActivePromotionsAsync();
            return promotions;
        }

        public async Task<List<Promotion>> GetPromotionsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            if (startDate > endDate)
                throw new ArgumentException("Start date must be before end date");

            var promotions = await _promotionRepository.GetPromotionsByDateRangeAsync(startDate, endDate);
            return promotions;
        }

        public async Task<Promotion> CreatePromotionAsync(Promotion promotion)
        {
            if (promotion == null)
                throw new ArgumentNullException(nameof(promotion));

            if (string.IsNullOrWhiteSpace(promotion.Code))
                throw new ArgumentException("Promotion code is required", nameof(promotion.Code));

            if (string.IsNullOrWhiteSpace(promotion.Name))
                throw new ArgumentException("Promotion name is required", nameof(promotion.Name));

            // Check for duplicate code
            var existingPromotion = await _promotionRepository.GetByCodeAsync(promotion.Code);
            if (existingPromotion != null)
                throw new InvalidOperationException($"Promotion with code '{promotion.Code}' already exists");

            promotion.CreatedAt = DateTime.UtcNow;
            return await _promotionRepository.AddAsync(promotion);
        }

        public async Task UpdatePromotionAsync(Promotion promotion)
        {
            if (promotion == null)
                throw new ArgumentNullException(nameof(promotion));

            if (promotion.Id <= 0)
                throw new ArgumentException("Invalid promotion ID", nameof(promotion.Id));

            var existingPromotion = await _promotionRepository.GetByIdAsync(promotion.Id);
            if (existingPromotion == null)
                throw new InvalidOperationException($"Promotion with ID {promotion.Id} not found");

            await _promotionRepository.UpdateAsync(promotion);
        }

        public async Task DeletePromotionAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid promotion ID", nameof(id));

            var promotion = await _promotionRepository.GetByIdAsync(id);
            if (promotion == null)
                throw new InvalidOperationException($"Promotion with ID {id} not found");

            await _promotionRepository.DeleteByIdAsync(id);
        }

        public async Task<(List<Promotion> Promotions, int TotalCount)> SearchAsync(string? keyword, bool? isActive, int page, int pageSize)
        {
            if (page < 1)
                throw new ArgumentException("Page number must be greater than 0", nameof(page));

            if (pageSize < 1 || pageSize > 100)
                throw new ArgumentException("Page size must be between 1 and 100", nameof(pageSize));

            var result = await _promotionRepository.SearchAsync(keyword, isActive, page, pageSize);
            return result;
        }

        public async Task<Promotion?> GetPromotionWithProductsAsync(int promotionId)
        {
            if (promotionId <= 0)
                throw new ArgumentException("Invalid promotion ID", nameof(promotionId));

            var promotion = await _promotionRepository.GetWithProductsAsync(promotionId);
            return promotion;
        }

        public async Task<PromotionApplicationResult> ApplyPromotionAsync(string code, decimal orderSubtotal, decimal shippingFee)
        {
            if (string.IsNullOrWhiteSpace(code))
                throw new ArgumentException("Promotion code is required", nameof(code));

            if (orderSubtotal < 0)
                throw new ArgumentException("Order subtotal cannot be negative", nameof(orderSubtotal));

            if (shippingFee < 0)
                throw new ArgumentException("Shipping fee cannot be negative", nameof(shippingFee));

            var promotion = await _promotionRepository.GetByCodeAsync(code.Trim());
            if (promotion == null)
                throw new InvalidOperationException("Mã giảm giá không tồn tại.");

            var now = DateTime.Now;
            if (!promotion.IsActive)
                throw new InvalidOperationException("Mã giảm giá đã bị vô hiệu.");

            if (promotion.StartDate > now || promotion.EndDate < now)
                throw new InvalidOperationException("Mã giảm giá không còn trong thời gian áp dụng.");

            if (promotion.UsageLimit.HasValue && promotion.UsedCount >= promotion.UsageLimit.Value)
                throw new InvalidOperationException("Mã giảm giá đã hết lượt sử dụng.");

            if (orderSubtotal < promotion.MinimumOrderAmount)
                throw new InvalidOperationException($"Đơn hàng tối thiểu {promotion.MinimumOrderAmount:N0} để dùng mã này.");

            var discountAmount = CalculateDiscountAmount(promotion, orderSubtotal, shippingFee);
            var finalTotal = Math.Max(0, orderSubtotal + shippingFee - discountAmount);

            return new PromotionApplicationResult
            {
                Promotion = promotion,
                DiscountAmount = discountAmount,
                FinalTotal = finalTotal,
                Message = "Áp dụng mã giảm giá thành công."
            };
        }

        private static decimal CalculateDiscountAmount(Promotion promotion, decimal orderSubtotal, decimal shippingFee)
        {
            var discountType = (promotion.DiscountType ?? "").Trim().ToUpperInvariant();
            decimal discountAmount = discountType switch
            {
                "PERCENT" => orderSubtotal * promotion.DiscountValue / 100,
                "AMOUNT" => promotion.DiscountValue,
                "FREESHIP" => shippingFee,
                _ => throw new InvalidOperationException("Loại mã giảm giá không hợp lệ.")
            };

            if (promotion.MaximumDiscountAmount.HasValue)
            {
                discountAmount = Math.Min(discountAmount, promotion.MaximumDiscountAmount.Value);
            }

            return Math.Min(Math.Max(0, discountAmount), orderSubtotal + shippingFee);
        }
    }
}
