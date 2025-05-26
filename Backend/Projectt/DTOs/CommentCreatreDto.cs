using System.ComponentModel.DataAnnotations;

namespace MySecureApi.DTOs
{
    public class CommentCreateDto
    {

        [Required]
        [StringLength(500, MinimumLength = 1)] 
        public string Text { get; set; } = string.Empty;
    }
}