using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ColorsController : ControllerBase
    {
        private readonly IRepository<Color> _colorRepository;

        public ColorsController(IRepository<Color> colorRepository)
        {
            _colorRepository = colorRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var colors = await _colorRepository.GetAllAsync();
            return Ok(colors);
        }
    }
}
