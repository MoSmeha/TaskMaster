using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySecureApi.Models
{
    public class Comment
    {
        public int Id { get; set; }

        [Required]
        public string Text { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        [Required]
        public string UserId { get; set; } = string.Empty;


        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } = null!; 

        public int TaskId { get; set; }

        [ForeignKey(nameof(TaskId))]
        public UserTask Task { get; set; } = null!; 
    }
}