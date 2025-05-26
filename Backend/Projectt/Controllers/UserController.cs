using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims; 

[Route("api/[controller]")]
[ApiController]
[Authorize] 
public class UserController : ControllerBase
{
    // GET: api/user/profile
    [HttpGet("profile")]
    public IActionResult GetUserProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); 
        var userName = User.FindFirstValue(ClaimTypes.Name);         
        var userEmail = User.FindFirstValue(ClaimTypes.Email);       
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList(); 
        //fallback, shouldn't happen bas bi 7al
        if (userId == null)
        {
            return Unauthorized();
        }

        return Ok(new
        {
            Message = $"Welcome, {userName}! This is your profile area.",
            UserId = userId,
            Username = userName,
            Email = userEmail,
            Roles = roles
        });
    }

    [HttpGet("user-specific-data")]
    [Authorize(Roles = "User")] // Requires the "User" role
    public IActionResult GetUserSpecificData()
    {
        var userName = User.Identity?.Name;
        return Ok(new { Message = $"Hello {userName}, this is data specifically for the 'User' role." });
    }


}

