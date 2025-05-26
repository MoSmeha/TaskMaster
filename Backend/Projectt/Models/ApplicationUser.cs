
using Microsoft.AspNetCore.Identity;
using System.Collections.Generic; 

namespace MySecureApi.Models
{

    public class ApplicationUser : IdentityUser
    {
        public ICollection<UserTask> AssignedTasks { get; set; } = new List<UserTask>(); 
        public ICollection<Note> Notes { get; set; } = new List<Note>(); 
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    }
}
