using System.ComponentModel.DataAnnotations;
using MySecureApi.Enums;

namespace MySecureApi.DTOs
{
    public class TaskCreateDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [EnumDataType(typeof(UrgencyLevel))]
        public UrgencyLevel Urgency { get; set; }

        public DateTime? DueDate { get; set; }

        [Required(ErrorMessage = "An assigned user ID is required.")]
        public string AssignedToUserId { get; set; } = string.Empty;

    }
}