
using Microsoft.AspNetCore.Mvc;
using MySecureApi.DTOs;
using MySecureApi.Services; 

using System.Threading.Tasks;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger; 

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    // POST: api/auth/register
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
        {
           
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
            return BadRequest(new AuthResponseDto { IsSuccess = false, Message = string.Join(" | ", errors) });
        }

        var result = await _authService.RegisterAsync(registerDto);

        if (!result.IsSuccess)
        {
           
            _logger.LogWarning("Registration failed for email {Email}: {Message}", registerDto.Email, result.Message);
            
            return BadRequest(result);
        }

        _logger.LogInformation("User registered successfully: {Username}", result.Username);
       
        return Ok(result);
    }

    // POST: api/auth/login
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
            return BadRequest(new AuthResponseDto { IsSuccess = false, Message = string.Join(" | ", errors) });
        }

        var result = await _authService.LoginAsync(loginDto);

        if (!result.IsSuccess)
        {
           
            _logger.LogWarning("Login failed for {UsernameOrEmail}: {Message}", loginDto.UsernameOrEmail, result.Message);
           
            return Unauthorized(result);
        }

        _logger.LogInformation("User logged in successfully: {Username}", result.Username);
        // Return OK with the full AuthResponseDto
        return Ok(result);
    }
}
