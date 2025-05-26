// MySecureApi/Models/Note.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MySecureApi.Models
{
    public class Note
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)] 
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        public DateTime DateCreated { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

 
        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } = null!;

    }
}
