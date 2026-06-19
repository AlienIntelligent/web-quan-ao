namespace BaseCore.Entities;

public class ProductVariantImage
{
    public int Id { get; set; }
    public int ProductVariantId { get; set; }
    public string ImageUrl { get; set; } = "";
    public bool IsDefault { get; set; }
    public int SortOrder { get; set; }

    public ProductVariant ProductVariant { get; set; } = null!;
}