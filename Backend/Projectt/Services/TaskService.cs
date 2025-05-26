using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MySecureApi.Data;
using MySecureApi.DTOs;
using MySecureApi.Enums;
using MySecureApi.Models;
using System.Security.Claims; 

namespace MySecureApi.Services
{
    public class TaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<TaskService> _logger;

        public TaskService(ApplicationDbContext context, UserManager<ApplicationUser> userManager, ILogger<TaskService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }


        private TaskViewDto MapTaskToViewDto(UserTask task, ApplicationUser? user)
        {
            var userName = user?.UserName ?? "Unknown User";
            var userEmail = user?.Email ?? "Unknown Email";

            return new TaskViewDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Urgency = task.Urgency.ToString(), // convert enum to string, sababet mashekel bel frontend
                Status = task.Status.ToString(),  
                DueDate = task.DueDate,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                AssignedToUserId = task.AssignedToUserId,
                AssignedToUserName = userName,
                AssignedToEmail = userEmail,
                Comments = task.Comments?.Select(c => MapCommentToViewDto(c, c.User)).ToList() ?? new List<CommentViewDto>()
            };
        }

        private CommentViewDto MapCommentToViewDto(Comment comment, ApplicationUser? user)
        {
            var userName = user?.UserName ?? "Unknown User";

            return new CommentViewDto
            {
                Id = comment.Id,
                Text = comment.Text,
                CreatedAt = comment.CreatedAt,
                AuthorId = comment.UserId,
                AuthorUserName = userName,

            };
        }


        public async Task<IEnumerable<UserSimpleDto>> GetAssignableUsersAsync()
        {
            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            if (adminRole == null)
            {
                _logger.LogError("Admin role not found in database during GetAssignableUsersAsync.");
                return Enumerable.Empty<UserSimpleDto>();
            }

            // Find users who are NOT in the Admin role
            // Use AsNoTracking() if you're just reading data
            var users = await _userManager.Users.AsNoTracking() 
                .Where(u => !_context.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == adminRole.Id))
                .Select(u => new UserSimpleDto
                {
                    Id = u.Id,
                    UserName = u.UserName ?? "N/A",
                    Email = u.Email ?? "N/A"
                })
                .ToListAsync();

            return users;
        }

        public IEnumerable<string> GetUrgencyLevels()
        {
            return Enum.GetNames(typeof(UrgencyLevel));
        }

        public async Task<(ServiceErrorReason Reason, TaskViewDto? CreatedTask)> CreateTaskAsync(TaskCreateDto taskDto)
        {
            var assignedUser = await _userManager.FindByIdAsync(taskDto.AssignedToUserId);
            if (assignedUser == null)
            {
                _logger.LogWarning("Attempted to create task for non-existent User ID: {UserId}", taskDto.AssignedToUserId);
                return (ServiceErrorReason.UserNotFound, null);
            }

            var newTask = new UserTask
            {
                Title = taskDto.Title,
                Description = taskDto.Description,
                Urgency = taskDto.Urgency,
                DueDate = taskDto.DueDate ?? DateTime.Now,

                AssignedToUserId = taskDto.AssignedToUserId,
                Status = TaskCompletionStatus.Assigned,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                _context.UserTasks.Add(newTask);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Task {TaskId} created for user {UserId}", newTask.Id, newTask.AssignedToUserId);

                var taskView = MapTaskToViewDto(newTask, assignedUser);
                return (ServiceErrorReason.Success, taskView);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving new task to database for user {UserId}", taskDto.AssignedToUserId);
                return (ServiceErrorReason.DatabaseError, null);
            }
        }

        public async Task<IEnumerable<TaskViewDto>> GetAllTasksAsync()
        {
            try
            {
                var tasks = await _context.UserTasks
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.Comments)
                        .ThenInclude(c => c.User) 
                    .AsNoTracking() 
                    .OrderByDescending(t => t.CreatedAt)
                    .ToListAsync();

                return tasks.Select(t => MapTaskToViewDto(t, t.AssignedToUser)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all tasks from database.");
                return Enumerable.Empty<TaskViewDto>();
            }
        }

        public async Task<TaskViewDto?> GetTaskByIdAsync(int id)
        {
            var task = await _context.UserTasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.Comments)
                    .ThenInclude(c => c.User) 
                .AsNoTracking() 
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
            {
                return null; 
            }

            return MapTaskToViewDto(task, task.AssignedToUser);
        }

        public async Task<ServiceErrorReason> UpdateTaskAsync(int id, TaskUpdateDto taskDto)
        {
            var task = await _context.UserTasks.Include(t => t.AssignedToUser).FirstOrDefaultAsync(t => t.Id == id);
            if (task == null)
            {
                return ServiceErrorReason.NotFound;
            }

            ApplicationUser? assignedUser = task.AssignedToUser;
            if (task.AssignedToUserId != taskDto.AssignedToUserId)
            {
                assignedUser = await _userManager.FindByIdAsync(taskDto.AssignedToUserId);
                if (assignedUser == null)
                {
                    _logger.LogWarning("Attempted to update task {TaskId} to non-existent User ID: {UserId}", id, taskDto.AssignedToUserId);
                    return ServiceErrorReason.UserNotFound;
                }

            }


            task.Title = taskDto.Title;
            task.Description = taskDto.Description;
            task.Urgency = taskDto.Urgency;
            task.DueDate = taskDto.DueDate ?? DateTime.Now;
            task.AssignedToUserId = taskDto.AssignedToUserId;
            task.Status = taskDto.Status;
            task.UpdatedAt = DateTime.UtcNow;


            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Task {TaskId} updated successfully.", id);
                return ServiceErrorReason.Success;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                var exists = await _context.UserTasks.AnyAsync(e => e.Id == id);
                if (!exists)
                {
                    _logger.LogWarning("Concurrency error updating Task {TaskId}: Task not found.", id);
                    return ServiceErrorReason.NotFound;
                }
                else
                {
                    _logger.LogError(ex, "Concurrency error updating Task {TaskId}.", id);
                    return ServiceErrorReason.ConcurrencyError;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving updated task {TaskId} to database.", id);
                return ServiceErrorReason.DatabaseError;
            }
        }

        public async Task<ServiceErrorReason> DeleteTaskAsync(int id)
        {
            var task = await _context.UserTasks.FindAsync(id);
            if (task == null)
            {
                return ServiceErrorReason.NotFound;
            }

            try
            {
                _context.UserTasks.Remove(task);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Task {TaskId} deleted successfully.", id);
                return ServiceErrorReason.Success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task {TaskId} from database.", id);
                return ServiceErrorReason.DatabaseError;
            }
        }


        // user operations

        public async Task<IEnumerable<TaskViewDto>> GetMyTasksAsync(string userId)
        {
            try
            {
                var tasks = await _context.UserTasks
                    .Include(t => t.AssignedToUser)
                    .Include(t => t.Comments)
                         .ThenInclude(c => c.User) // Include the user who made the comment
                    .AsNoTracking() // Added AsNoTracking
                    .Where(t => t.AssignedToUserId == userId)
                    .OrderByDescending(t => t.CreatedAt)
                    .ToListAsync();

                return tasks.Select(t => MapTaskToViewDto(t, t.AssignedToUser)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks for user {UserId} from database.", userId);
                return Enumerable.Empty<TaskViewDto>();
            }
        }

        public async Task<ServiceErrorReason> UpdateTaskStatusAsync(int id, string userId, TaskStatusUpdateDto statusDto)
        {
            var task = await _context.UserTasks.FindAsync(id);

            if (task == null)
            {
                return ServiceErrorReason.NotFound;
            }

            // Fetch the user making the request to check their roles
            var userMakingRequest = await _userManager.FindByIdAsync(userId);
            if (userMakingRequest == null)
            {
                _logger.LogWarning("User {UserId} attempting to update task status not found in system.", userId);
                return ServiceErrorReason.UserNotFound; 
            }

            bool isUserAdmin = await _userManager.IsInRoleAsync(userMakingRequest, "Admin");

            // verify the task belongs to the current user OR the current user is an Admin
            if (!isUserAdmin && task.AssignedToUserId != userId)
            {
                _logger.LogWarning("User {UserId} (not Admin) attempted to update status of task {TaskId} belonging to user {OwnerId}.", userId, id, task.AssignedToUserId);
                return ServiceErrorReason.Forbidden;
            }

            task.Status = statusDto.Status;
            task.UpdatedAt = DateTime.UtcNow;

            _context.Entry(task).Property(x => x.Status).IsModified = true;
            _context.Entry(task).Property(x => x.UpdatedAt).IsModified = true;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Status updated for task {TaskId} by user {UserId}. Admin status: {IsAdmin}", id, userId, isUserAdmin);
                return ServiceErrorReason.Success;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                var exists = await _context.UserTasks.AnyAsync(e => e.Id == id);
                if (!exists)
                {
                    _logger.LogWarning("Concurrency error updating status for Task {TaskId}: Task not found.", id);
                    return ServiceErrorReason.NotFound;
                }
                else
                {
                    _logger.LogError(ex, "Concurrency error updating status for Task {TaskId}.", id);
                    return ServiceErrorReason.ConcurrencyError;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving updated status for task {TaskId} to database.", id);
                return ServiceErrorReason.DatabaseError;
            }
        }

        // comment operations
        public async Task<(ServiceErrorReason Reason, CommentViewDto? CreatedComment)> AddCommentToTaskAsync(int taskId, string userId, CommentCreateDto commentDto)
        {
            var taskExists = await _context.UserTasks.AsNoTracking().AnyAsync(t => t.Id == taskId);
            if (!taskExists)
            {
                _logger.LogWarning("Attempted to add comment to non-existent Task ID: {TaskId}", taskId);
                return (ServiceErrorReason.NotFound, null);
            }

            var userMakingComment = await _userManager.FindByIdAsync(userId);
            if (userMakingComment == null)
            {
                _logger.LogWarning("User {UserId} attempting to add comment not found in system.", userId);
                return (ServiceErrorReason.UserNotFound, null);
            }

            var newComment = new Comment
            {
                Text = commentDto.Text,
                TaskId = taskId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                _context.Comments.Add(newComment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Comment {CommentId} added to task {TaskId} by user {UserId}", newComment.Id, taskId, userId);


                var commentView = MapCommentToViewDto(newComment, userMakingComment);

                return (ServiceErrorReason.Success, commentView);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving new comment for task {TaskId} by user {UserId} to database.", taskId, userId);
                return (ServiceErrorReason.DatabaseError, null);
            }
        }
    }
}