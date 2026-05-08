using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SizesController : ControllerBase
    {
        private readonly IRepository<Size> _sizeRepository;

        public SizesController(IRepository<Size> sizeRepository)
        {
            _sizeRepository = sizeRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sizes = await _sizeRepository.GetAllAsync();
            return Ok(sizes);
        }
    }
}
