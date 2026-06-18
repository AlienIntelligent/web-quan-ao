using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<CartDetail> CartDetails { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderDetail> OrderDetails { get; set; }

    public virtual DbSet<OrderPromotion> OrderPromotions { get; set; }

    public virtual DbSet<Origin> Origins { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductVariant> ProductVariants { get; set; }

    public virtual DbSet<ProductOrigin> ProductOrigins { get; set; }

    public virtual DbSet<Promotion> Promotions { get; set; }

    public virtual DbSet<PromotionProduct> PromotionProducts { get; set; }

    public virtual DbSet<Shipping> Shippings { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Size> Sizes { get; set; }

    public virtual DbSet<Color> Colors { get; set; }

    public virtual DbSet<WishlistItem> WishlistItems { get; set; }

    public virtual DbSet<ProductVariantImage> ProductVariantImages { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer("Data Source=XD\\SQLSERVER2022;Initial Catalog=BaseCoreSales;Integrated Security=True;Encrypt=True;Trust Server Certificate=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CartDetail>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.ProductId, e.VariantId }, "UQ_CartDetails_User_Product_Variant").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Quantity).HasDefaultValue(1);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Product).WithMany(p => p.CartDetails)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.ProductVariant).WithMany()
                .HasForeignKey(d => d.VariantId);

            entity.HasOne(d => d.User).WithMany(p => p.CartDetails).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<WishlistItem>(entity =>
        {
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Product).WithMany()
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.ProductVariant).WithMany()
                .HasForeignKey(d => d.VariantId);

            entity.HasOne(d => d.User).WithMany(p => p.WishlistItems)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasIndex(e => e.UserId, "IX_Orders_UserId");

            entity.Property(e => e.OrderDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Status).HasMaxLength(30);
            entity.Property(e => e.ShippingAddress).HasMaxLength(500);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OrderCode).HasMaxLength(20);
            entity.Property(e => e.PaymentMethod).HasMaxLength(30);
            entity.Property(e => e.PaymentStatus).HasMaxLength(30);
            entity.Property(e => e.ShippingFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.FinalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.CancelledReason).HasMaxLength(200);

            entity.HasOne(d => d.User).WithMany(p => p.Orders)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<OrderDetail>(entity =>
        {
            entity.HasIndex(e => e.OrderId, "IX_OrderDetails_OrderId");

            entity.HasIndex(e => e.ProductId, "IX_OrderDetails_ProductId");

            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderDetailOrders).HasForeignKey(d => d.OrderId);

            entity.HasOne(d => d.Product).WithMany(p => p.OrderDetails)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.ProductVariant).WithMany(p => p.OrderDetails)
                .HasForeignKey(d => d.VariantId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<OrderPromotion>(entity =>
        {
            entity.Property(e => e.AppliedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderPromotions).HasForeignKey(d => d.OrderId);

            entity.HasOne(d => d.Promotion).WithMany(p => p.OrderPromotions)
                .HasForeignKey(d => d.PromotionId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Origin>(entity =>
        {
            entity.HasIndex(e => e.Name, "UQ_Origins_Name").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(e => e.CategoryId, "IX_Products_CategoryId");

            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OriginalPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.ToTable("ProductVariants");

            entity.Property(e => e.Size).HasMaxLength(10);
            entity.Property(e => e.Color).HasMaxLength(20);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Product)
                .WithMany(p => p.ProductVariants)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.SizeNavigation).WithMany(p => p.ProductVariants)
                .HasForeignKey(d => d.SizeId);

            entity.HasOne(d => d.ColorNavigation).WithMany(p => p.ProductVariants)
                .HasForeignKey(d => d.ColorId);
        });

        modelBuilder.Entity<Size>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(10);
        });

        modelBuilder.Entity<Color>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.HexCode).HasMaxLength(7);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.ToTable("Reviews");

            entity.Property(e => e.UserId).HasMaxLength(450);
            entity.Property(e => e.Comment).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Product)
                .WithMany(p => p.Reviews)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductOrigin>(entity =>
        {
            entity.HasIndex(e => e.ProductId, "UQ_ProductOrigins_ProductId").IsUnique();

            entity.HasOne(d => d.Origin).WithMany(p => p.ProductOrigins).HasForeignKey(d => d.OriginId);

            entity.HasOne(d => d.Product).WithOne(p => p.ProductOrigin).HasForeignKey<ProductOrigin>(d => d.ProductId);
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasIndex(e => e.Code, "UQ_Promotions_Code").IsUnique();

            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.DiscountType).HasMaxLength(30);
            entity.Property(e => e.DiscountValue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MaximumDiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MinimumOrderAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<PromotionProduct>(entity =>
        {
            entity.HasIndex(e => new { e.PromotionId, e.ProductId }, "UQ_PromotionProducts_Promotion_Product").IsUnique();

            entity.HasOne(d => d.Product).WithMany(p => p.PromotionProducts).HasForeignKey(d => d.ProductId);

            entity.HasOne(d => d.Promotion).WithMany(p => p.PromotionProducts).HasForeignKey(d => d.PromotionId);
        });

        modelBuilder.Entity<Shipping>(entity =>
        {
            entity.HasIndex(e => e.OrderId, "UQ_Shippings_OrderId").IsUnique();

            entity.Property(e => e.CarrierName).HasMaxLength(100);
            entity.Property(e => e.Note).HasMaxLength(1000);
            entity.Property(e => e.ReceiverName).HasMaxLength(100);
            entity.Property(e => e.ReceiverPhone).HasMaxLength(20);
            entity.Property(e => e.ShippingAddress).HasMaxLength(500);
            entity.Property(e => e.ShippingFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ShippingMethod)
                .HasMaxLength(30)
                .HasDefaultValue("STANDARD");
            entity.Property(e => e.ShippingStatus)
                .HasMaxLength(30)
                .HasDefaultValue("WAITING");
            entity.Property(e => e.TrackingCode).HasMaxLength(100);

            entity.HasOne(d => d.Order).WithOne(p => p.Shipping).HasForeignKey<Shipping>(d => d.OrderId);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.UserName, "IX_Users_UserName").IsUnique();

            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Password).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.UserName).HasMaxLength(50);
        });

        modelBuilder.Entity<ProductVariantImage>(entity =>
        {
            entity.ToTable("ProductVariantImages");

            entity.Property(e => e.ImageUrl).HasMaxLength(500);

            entity.HasOne(e => e.ProductVariant)
                .WithMany(v => v.ProductVariantImages)
                .HasForeignKey(e => e.ProductVariantId);
        });
        
        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

