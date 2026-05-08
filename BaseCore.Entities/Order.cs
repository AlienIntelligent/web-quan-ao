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

    public string OrderCode { get; set; } = null!;
    public string PaymentMethod { get; set; } = null!;
    public string PaymentStatus { get; set; } = null!;
    public decimal ShippingFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public string? Note { get; set; }
    public string? CancelledReason { get; set; }
    public DateTime? CancelledAt { get; set; }

    public virtual ICollection<OrderDetail> OrderDetailOrders { get; set; } = new List<OrderDetail>();

    public virtual ICollection<OrderPromotion> OrderPromotions { get; set; } = new List<OrderPromotion>();

    public virtual Shipping? Shipping { get; set; }

    public virtual User User { get; set; } = null!;
}


