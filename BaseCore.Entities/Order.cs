using System;
using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class Order
{
    public int Id { get; set; }

    public string UserId { get; set; } = null!;

    public DateTime OrderDate { get; set; }

    public decimal TotalAmount { get; set; }

    public string Status { get; set; } = null!;

    public string ShippingAddress { get; set; } = null!;

    public virtual ICollection<OrderDetail> OrderDetailOrders { get; set; } = new List<OrderDetail>();

    public virtual ICollection<OrderPromotion> OrderPromotions { get; set; } = new List<OrderPromotion>();

    public virtual Shipping? Shipping { get; set; }

    public virtual User User { get; set; } = null!;
}


