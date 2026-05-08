using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class Color
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? HexCode { get; set; }

    public virtual ICollection<ProductVariant> ProductVariants { get; set; } = new List<ProductVariant>();
}
