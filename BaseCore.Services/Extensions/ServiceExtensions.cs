using Microsoft.Extensions.DependencyInjection;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using BaseCore.Services;

namespace BaseCore.Services.Extensions
{
    /// <summary>
    /// Service registration extensions for dependency injection
    /// </summary>
    public static class ServiceExtensions
    {
        /// <summary>
        /// Register all repository services
        /// </summary>
        public static IServiceCollection AddRepositories(this IServiceCollection services)
        {
            // Generic Repository
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

            // Specific Repositories
            services.AddScoped<IProductRepository, ProductRepository>();
            services.AddScoped<ICategoryRepository, CategoryRepository>();
            services.AddScoped<IOrderRepository, OrderRepository>();
            services.AddScoped<IOrderDetailRepository, OrderDetailRepository>();
            services.AddScoped<IPromotionRepository, PromotionRepository>();
            services.AddScoped<IShippingRepository, ShippingRepository>();
            services.AddScoped<ICartDetailRepository, CartDetailRepository>();
            services.AddScoped<IOriginRepository, OriginRepository>();
            services.AddScoped<IProductOriginRepository, ProductOriginRepository>();
            services.AddScoped<IUserRepository, UserRepository>();

            return services;
        }

        /// <summary>
        /// Register all application services
        /// </summary>
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<IProductService, ProductService>();
            services.AddScoped<IOrderService, OrderService>();
            services.AddScoped<IPromotionService, PromotionService>();
            services.AddScoped<IShippingService, ShippingService>();
            services.AddScoped<ICartService, CartService>();
            services.AddScoped<IOriginService, OriginService>();
            services.AddScoped<IProductOriginService, ProductOriginService>();

            return services;
        }

        /// <summary>
        /// Register all repositories and services in one call
        /// </summary>
        public static IServiceCollection AddAllServices(this IServiceCollection services)
        {
            services.AddRepositories();
            services.AddApplicationServices();
            return services;
        }
    }
}
