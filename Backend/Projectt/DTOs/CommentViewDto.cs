using System;

namespace MySecureApi.DTOs
{
    public class CommentViewDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string AuthorId { get; set; } = string.Empty;
        public string AuthorUserName { get; set; } = string.Empty;
    }
}