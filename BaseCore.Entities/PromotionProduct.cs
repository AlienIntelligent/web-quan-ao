using System;
using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class PromotionProduct
{
    public int Id { get; set; }

    public int PromotionId { get; set; }

    public int ProductId { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual Promotion Promotion { get; set; } = null!;
}


