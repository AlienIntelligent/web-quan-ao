using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Services;
using System;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Should ideally be Admin only
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var stats = await _analyticsService.GetDashboardStatsAsync();
            return Ok(stats);
        }

        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenue(
            [FromQuery] DateTime? start,
            [FromQuery] DateTime? end,
            [FromQuery] string groupBy = "day")
        {
            var mode = string.IsNullOrWhiteSpace(groupBy)
                ? "day"
                : groupBy.Trim().ToLower();

            if (mode is not ("day" or "month" or "year"))
                return BadRequest(new { message = "groupBy must be day, month, or year" });

            var startDate = start ?? DateTime.Now.AddDays(-30);
            var endDate = end ?? DateTime.Now;

            var report = await _analyticsService.GetRevenueReportAsync(startDate, endDate, mode);
            return Ok(report);
        }

        [HttpGet("best-sellers")]
        public async Task<IActionResult> GetBestSellers([FromQuery] int top = 5)
        {
            var data = await _analyticsService.GetBestSellersAsync(top);
            return Ok(data);
        }
    }
}
