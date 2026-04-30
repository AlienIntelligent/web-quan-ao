using System;
using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class Review
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string UserId { get; set; } = null!;

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

