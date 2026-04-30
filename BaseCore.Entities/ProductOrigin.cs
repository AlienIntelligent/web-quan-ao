using System;
using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class ProductOrigin
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public int OriginId { get; set; }

    public virtual Origin Origin { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;
}


