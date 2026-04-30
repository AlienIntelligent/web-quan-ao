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

    public virtual Product Product { get; set; } = null!;
}

