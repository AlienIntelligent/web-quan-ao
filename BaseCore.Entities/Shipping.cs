using System;
using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class Shipping
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public string ReceiverName { get; set; } = null!;

    public string ReceiverPhone { get; set; } = null!;

    public string ShippingAddress { get; set; } = null!;

    public string ShippingMethod { get; set; } = null!;

    public string ShippingStatus { get; set; } = null!;

    public decimal ShippingFee { get; set; }

    public DateTime? ShippedDate { get; set; }

    public DateTime? EstimatedDeliveryDate { get; set; }

    public DateTime? DeliveredDate { get; set; }

    public string? TrackingCode { get; set; }

    public string? CarrierName { get; set; }

    public string? Note { get; set; }

    public virtual Order Order { get; set; } = null!;
}


