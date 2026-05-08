using System;

namespace BaseCore.Entities;

public partial class WishlistItem
{
    public int Id { get; set; }

    public string UserId { get; set; } = null!;

    public int ProductId { get; set; }

    public int? VariantId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual ProductVariant? ProductVariant { get; set; }

    public virtual User User { get; set; } = null!;
}
