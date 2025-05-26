using MySecureApi.DTOs;
using System.Threading.Tasks;

namespace MySecureApi.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);

    }
}
