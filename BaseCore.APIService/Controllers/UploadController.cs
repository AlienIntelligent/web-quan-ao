using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.APIService.Controllers;

[Route("api/uploads")]
[ApiController]
[Authorize(Roles = "Admin")]
public class UploadsController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    [HttpPost("image")]
    public async Task<IActionResult> UploadImage(IFormFile file, [FromForm] string folder = "products")
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Chưa chọn file ảnh" });

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { message = "Chỉ cho phép jpg, png, webp, gif" });

        var safeFolder = folder == "variants" ? "variants" : "products";
        var uploadDir = @"D:\web-quan-ao\BaseCore.WebClient\public\img\products";

        Directory.CreateDirectory(uploadDir);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadDir, fileName);

        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream);

        var imageUrl = $"/img/products/{fileName}";
        return Ok(new { imageUrl });
    }
}