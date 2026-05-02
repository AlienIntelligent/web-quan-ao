using Microsoft.AspNetCore.Mvc;
using BaseCore.Common;
using BaseCore.Services.Authen;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace BaseCore.AuthService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private const string SecretKey = "YourSecretKeyForAuthenticationShouldBeLongEnough";
        private const int TokenExpirationMinutes = 480; // 8 hours

        public AuthController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            var user = await _userService.Authenticate(request.Username, request.Password);

            if (user == null)
            {
                var existingUser = await _userService.GetByUsername(request.Username);
                if (existingUser != null && !existingUser.IsActive)
                {
                    return Unauthorized(new { message = "Account is pending admin approval" });
                }
                return Unauthorized(new { message = "Invalid username or password" });
            }

            // Generate JWT token
            var token = TokenHelper.GenerateToken(
                SecretKey,
                TokenExpirationMinutes,
                user.Id.ToString(),
                user.UserName,
                user.UserType == 1 ? "Admin" : "User"
            );

            return Ok(new LoginResponse
            {
                Token = token,
                UserId = user.Id.ToString(),
                Username = user.UserName,
                Name = user.Name,
                Email = user.Email,
                Role = user.UserType == 1 ? "Admin" : "User",
                ExpiresIn = TokenExpirationMinutes * 60
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid request payload" });
            }

            System.Console.WriteLine($"Register attempt: Username={request.Username}, Email={request.Email}");

            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            if (request.Password.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters" });
            }

            try
            {
                // Check if username already exists to avoid DB unique constraint errors
                var existing = await _userService.GetByUsername(request.Username);
                if (existing != null)
                {
                    return BadRequest(new { message = "Registration failed: Username already exists" });
                }
                var user = new BaseCore.Entities.User
                {
                    UserName = request.Username,
                    Name = request.Name ?? request.Username,
                    Email = request.Email ?? string.Empty,
                    Phone = request.Phone ?? string.Empty,
                    UserType = 0 // Default to regular user
                };

                var createdUser = await _userService.Create(user, request.Password, false);

                System.Console.WriteLine($"Registration successful for user: {request.Username}, Id: {createdUser.Id}");

                return Ok(new
                {
                    message = "Registration submitted. Please wait for admin approval before logging in.",
                    userId = createdUser.Id
                });
            }
            catch (System.Exception ex)
            {
                // Log the exception for debugging in Development
                System.Console.WriteLine("Registration exception: " + ex.ToString());
                var inner = ex.InnerException != null ? ex.InnerException.Message : "None";
                return BadRequest(new { message = $"Registration failed: {ex.Message}. Inner: {inner}" });
            }
        }
    }

    public class LoginRequest
    {
        [JsonPropertyName("username")]
        public string? Username { get; set; }

        [JsonPropertyName("password")]
        public string? Password { get; set; }
    }

    public class LoginResponse
    {
        public string Token { get; set; }
        public string UserId { get; set; }
        public string Username { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public int ExpiresIn { get; set; }
    }

    public class RegisterRequest
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
    }
}


