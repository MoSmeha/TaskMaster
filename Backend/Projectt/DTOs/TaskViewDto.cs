using MySecureApi.Enums;

namespace MySecureApi.DTOs
{
    public class TaskViewDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Urgency { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string AssignedToUserId { get; set; } = string.Empty;
        public string AssignedToUserName { get; set; } = string.Empty;
        public string AssignedToEmail { get; set; } = string.Empty; 

        public List<CommentViewDto> Comments { get; set; } = new List<CommentViewDto>();
    }
}