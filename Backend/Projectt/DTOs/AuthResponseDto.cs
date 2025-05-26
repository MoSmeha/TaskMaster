// DTOs/AuthResponseDto.cs
namespace MySecureApi.DTOs
{
    public class AuthResponseDto
    {
        public string? Token { get; set; }
        public string? UserId { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public IList<string>? Roles { get; set; }
        public bool IsSuccess { get; set; }
        public string? Message { get; set; } // For error messages
    }
}