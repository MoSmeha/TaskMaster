using System.ComponentModel.DataAnnotations;
using MySecureApi.Enums;

namespace MySecureApi.DTOs
{
    public class TaskStatusUpdateDto
    {
        [Required]
        [EnumDataType(typeof(TaskCompletionStatus))]
        public TaskCompletionStatus Status { get; set; }
    }
}