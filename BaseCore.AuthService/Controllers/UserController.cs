using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Services.Authen;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace BaseCore.AuthService.Controllers
{
    [Route("api/users")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string keyword = "",
            [FromQuery] string? phone = null,
            [FromQuery] int? userType = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (users, totalCount) = await _userService.Search(keyword, phone, userType, isActive, page, pageSize);

            var result = users.Select(u => new UserResponse
            {
                Id = u.Id,
                Username = u.UserName,
                Name = u.Name,
                Email = u.Email,
                Phone = u.Phone,
                Position = u.Position,
                IsActive = u.IsActive,
                UserType = u.UserType,
                Created = u.Created
            });

            return Ok(new
            {
                data = result,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!User.IsInRole("Admin") && currentUserId != id)
                return Forbid();

            var user = await _userService.GetById(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new UserResponse
            {
                Id = user.Id,
                Username = user.UserName,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Position = user.Position,
                IsActive = user.IsActive,
                UserType = user.UserType,
                Created = user.Created
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid request" });
            }

            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            try
            {
                var user = new User
                {
                    UserName = request.Username,
                    Name = request.Name ?? request.Username,
                    Email = request.Email,
                    Phone = request.Phone,
                    Position = request.Position,
                    UserType = request.UserType
                };

                var createdUser = await _userService.Create(user, request.Password, true);

                return CreatedAtAction(nameof(GetById), new { id = createdUser.Id }, new UserResponse
                {
                    Id = createdUser.Id,
                    Username = createdUser.UserName,
                    Name = createdUser.Name,
                    Email = createdUser.Email,
                    Phone = createdUser.Phone,
                    Position = createdUser.Position,
                    IsActive = createdUser.IsActive,
                    UserType = createdUser.UserType,
                    Created = createdUser.Created
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to create user: " + ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid request payload" });
            }

            try
            {
                var existingUser = await _userService.GetById(id);
                if (existingUser == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Log the update attempt for debugging
                System.Console.WriteLine($"Updating user {id}: IsActive={request.IsActive}");

                existingUser.Name = request.Name ?? existingUser.Name;
                existingUser.Email = request.Email ?? existingUser.Email;
                existingUser.Phone = request.Phone ?? existingUser.Phone;
                existingUser.Position = request.Position ?? existingUser.Position;
                
                if (request.UserType.HasValue)
                    existingUser.UserType = request.UserType.Value;
                
                if (request.IsActive.HasValue)
                    existingUser.IsActive = request.IsActive.Value;

                await _userService.Update(existingUser, request.Password);

                return Ok(new UserResponse
                {
                    Id = existingUser.Id,
                    Username = existingUser.UserName,
                    Name = existingUser.Name,
                    Email = existingUser.Email,
                    Phone = existingUser.Phone,
                    Position = existingUser.Position,
                    IsActive = existingUser.IsActive,
                    UserType = existingUser.UserType,
                    Created = existingUser.Created
                });
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"Update user exception: {ex}");
                var inner = ex.InnerException != null ? ex.InnerException.Message : "None";
                return BadRequest(new { message = $"Failed to update user: {ex.Message}. Inner: {inner}" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var existingUser = await _userService.GetById(id);
            if (existingUser == null)
            {
                return NotFound(new { message = "User not found" });
            }

            await _userService.Delete(id);
            return NoContent();
        }
    }

    public class UserResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }
        
        [JsonPropertyName("username")]
        public string Username { get; set; }
        
        [JsonPropertyName("name")]
        public string Name { get; set; }
        
        [JsonPropertyName("email")]
        public string Email { get; set; }
        
        [JsonPropertyName("phone")]
        public string Phone { get; set; }
        
        [JsonPropertyName("position")]
        public string Position { get; set; }
        
        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }
        
        [JsonPropertyName("userType")]
        public int UserType { get; set; }
        
        [JsonPropertyName("created")]
        public DateTime Created { get; set; }
    }

    public class CreateUserRequest
    {
        [JsonPropertyName("username")]
        public string? Username { get; set; }
        
        [JsonPropertyName("password")]
        public string? Password { get; set; }
        
        [JsonPropertyName("name")]
        public string? Name { get; set; }
        
        [JsonPropertyName("email")]
        public string? Email { get; set; }
        
        [JsonPropertyName("phone")]
        public string? Phone { get; set; }
        
        [JsonPropertyName("position")]
        public string? Position { get; set; }
        
        [JsonPropertyName("userType")]
        public int UserType { get; set; }
    }

    public class UpdateUserRequest
    {
        [JsonPropertyName("password")]
        public string? Password { get; set; }
        
        [JsonPropertyName("name")]
        public string? Name { get; set; }
        
        [JsonPropertyName("email")]
        public string? Email { get; set; }
        
        [JsonPropertyName("phone")]
        public string? Phone { get; set; }
        
        [JsonPropertyName("position")]
        public string? Position { get; set; }
        
        [JsonPropertyName("userType")]
        public int? UserType { get; set; }
        
        [JsonPropertyName("isActive")]
        public bool? IsActive { get; set; }
    }
}


