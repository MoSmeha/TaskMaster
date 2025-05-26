using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MySecureApi.Enums;

namespace MySecureApi.Models
{
    public class UserTask
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)] 
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
 
        public UrgencyLevel Urgency { get; set; }

        [Required]

        public TaskCompletionStatus Status { get; set; }

        public DateTime DueDate { get; set; } 
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; } 

        [Required]
        public string AssignedToUserId { get; set; } = string.Empty;

        [ForeignKey(nameof(AssignedToUserId))]
        public ApplicationUser AssignedToUser { get; set; } = null!; 
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();

    }
}
