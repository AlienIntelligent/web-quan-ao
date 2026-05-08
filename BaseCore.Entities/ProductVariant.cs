using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class ProductVariant
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string Size { get; set; } = null!;

    public string? Color { get; set; }

    public int Stock { get; set; }

    public decimal Price { get; set; }

    public int? SizeId { get; set; }

    public int? ColorId { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual Size? SizeNavigation { get; set; }

    public virtual Color? ColorNavigation { get; set; }

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
}

