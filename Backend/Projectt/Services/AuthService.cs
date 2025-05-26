using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using MySecureApi.DTOs;
using MySecureApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Linq; 

namespace MySecureApi.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager; 
        private readonly IConfiguration _configuration;
        private readonly SignInManager<ApplicationUser> _signInManager; 

        public AuthService(UserManager<ApplicationUser> userManager,
                           RoleManager<IdentityRole> roleManager,
                           IConfiguration configuration,
                           SignInManager<ApplicationUser> signInManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _signInManager = signInManager; 
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            // check if user already exists
            var existingUserByEmail = await _userManager.FindByEmailAsync(registerDto.Email!);
            if (existingUserByEmail != null)
            {
                return new AuthResponseDto { IsSuccess = false, Message = "Email already exists." };
            }
            var existingUserByUsername = await _userManager.FindByNameAsync(registerDto.Username!);
            if (existingUserByUsername != null)
            {
                return new AuthResponseDto { IsSuccess = false, Message = "Username already exists." };
            }


            // creating the new user object
            var newUser = new ApplicationUser
            {
                UserName = registerDto.Username,
                Email = registerDto.Email,
                EmailConfirmed = true 
            };

            // menzedo 3al database
            var result = await _userManager.CreateAsync(newUser, registerDto.Password!);

            if (!result.Succeeded)
            {
                // Combine errors into a single message
                var errorMessage = string.Join(", ", result.Errors.Select(e => e.Description));
                return new AuthResponseDto { IsSuccess = false, Message = $"User creation failed: {errorMessage}" };
            }

            // assign default "User" role 
            if (!await _roleManager.RoleExistsAsync("User"))
            {
                //fallback be7al 
                Console.WriteLine("CRITICAL: 'User' role does not exist during registration.");
            }
            await _userManager.AddToRoleAsync(newUser, "User");


            // generating the jwt token
            var roles = await _userManager.GetRolesAsync(newUser);
            var token = GenerateJwtToken(newUser, roles); 

            return new AuthResponseDto
            {
                IsSuccess = true,
                Message = "User registered successfully!",
                Token = token,
                UserId = newUser.Id,
                Username = newUser.UserName,
                Email = newUser.Email,
                Roles = roles 
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userManager.FindByNameAsync(loginDto.UsernameOrEmail!)
                       ?? await _userManager.FindByEmailAsync(loginDto.UsernameOrEmail!);

            if (user == null)
            {
                return new AuthResponseDto { IsSuccess = false, Message = "Invalid username or email." };
            }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, loginDto.Password!);
            if (!isPasswordValid)
            {

                return new AuthResponseDto { IsSuccess = false, Message = "Invalid password." };
            }

            var roles = await _userManager.GetRolesAsync(user);

            var token = GenerateJwtToken(user, roles); // Pass user and roles

            return new AuthResponseDto
            {
                IsSuccess = true,
                Message = "Login successful!",
                Token = token,
                UserId = user.Id,
                Username = user.UserName,
                Email = user.Email,
                Roles = roles 
            };
        }
        private string GenerateJwtToken(ApplicationUser user, IList<string> roles)
        {
            var jwtKey = _configuration["Jwt:Key"];
            var jwtIssuer = _configuration["Jwt:Issuer"];
            var jwtAudience = _configuration["Jwt:Audience"];

            if (string.IsNullOrEmpty(jwtKey) || string.IsNullOrEmpty(jwtIssuer) || string.IsNullOrEmpty(jwtAudience))
            {
                throw new InvalidOperationException("JWT Key, Issuer or Audience is not configured properly in appsettings.");
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id), 
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), 
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
                new Claim(ClaimTypes.NameIdentifier, user.Id), 
                new Claim(ClaimTypes.Name, user.UserName!), 
                new Claim(ClaimTypes.Email, user.Email!) 
            };


            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }


            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(60), 
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
