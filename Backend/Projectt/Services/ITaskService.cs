
using MySecureApi.DTOs;
using MySecureApi.Enums;
using System.Collections.Generic;

namespace MySecureApi.Services
{
  
    public enum ServiceErrorReason
    {
        Success,
        NotFound,
        Forbidden,
        BadRequest, 
        ConcurrencyError,
        DatabaseError,
        UserNotFound 
    }

    public interface ITaskService
    {
        //  Admin Operations 
        Task<IEnumerable<UserSimpleDto>> GetAssignableUsersAsync();
        IEnumerable<string> GetUrgencyLevels();
        Task<(ServiceErrorReason Reason, TaskViewDto? CreatedTask)> CreateTaskAsync(TaskCreateDto taskDto);
        Task<IEnumerable<TaskViewDto>> GetAllTasksAsync();
        Task<TaskViewDto?> GetTaskByIdAsync(int id);
        Task<ServiceErrorReason> UpdateTaskAsync(int id, TaskUpdateDto taskDto);
        Task<ServiceErrorReason> DeleteTaskAsync(int id);

        //  User Operations 
        Task<IEnumerable<TaskViewDto>> GetMyTasksAsync(string userId);
        Task<ServiceErrorReason> UpdateTaskStatusAsync(int id, string userId, TaskStatusUpdateDto statusDto);

        //  Comment Operations 
       
        Task<(ServiceErrorReason Reason, CommentViewDto? CreatedComment)> AddCommentToTaskAsync(int taskId, string userId, CommentCreateDto commentDto);
    }
}