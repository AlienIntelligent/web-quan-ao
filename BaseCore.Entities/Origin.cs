using System;
using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class Origin
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<ProductOrigin> ProductOrigins { get; set; } = new List<ProductOrigin>();
}


