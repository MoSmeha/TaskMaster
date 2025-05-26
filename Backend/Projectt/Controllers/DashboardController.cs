using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    // GET: api/dashboard/admin-data
    [HttpGet("admin-data")]
    public IActionResult GetAdminData()
    {

        var username = User.Identity?.Name; 

        return Ok(new { Message = $"Welcome to the Admin Dashboard, {username}! This data is admin-only." });
    }


}
