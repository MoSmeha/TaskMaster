
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MySecureApi.DTOs;
using MySecureApi.Enums; 
using MySecureApi.Services;
using System.Security.Claims; 

namespace MySecureApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] 
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly ILogger<TasksController> _logger;

        public TasksController(ITaskService taskService, ILogger<TasksController> logger)
        {
            _taskService = taskService;
            _logger = logger;
        }

        private string? GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

        //admin

        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<UserSimpleDto>>> GetAssignableUsers()
        {
            var users = await _taskService.GetAssignableUsersAsync();
            return Ok(users);
        }

        // GET: api/tasks/urgency-levels
        [HttpGet("urgency-levels")]
        public IActionResult GetUrgencyLevels()
        {
            var levels = _taskService.GetUrgencyLevels();
            return Ok(levels);
        }

        // POST: api/tasks [Admin]
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TaskViewDto>> CreateTask(TaskCreateDto taskDto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var (reason, createdTask) = await _taskService.CreateTaskAsync(taskDto);

            switch (reason)
            {
                case ServiceErrorReason.Success:
                    return CreatedAtAction(nameof(GetTaskById), new { id = createdTask!.Id }, createdTask);
                case ServiceErrorReason.UserNotFound:
                    ModelState.AddModelError(nameof(taskDto.AssignedToUserId), "Assigned user not found.");
                    return ValidationProblem(ModelState);
                case ServiceErrorReason.DatabaseError:
                    _logger.LogError("Database error creating task.");
                    return Problem("An error occurred while creating the task.", statusCode: StatusCodes.Status500InternalServerError);
                default:
                    _logger.LogError("Unhandled ServiceErrorReason in CreateTask: {Reason}", reason);
                    return Problem("An unexpected error occurred.", statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // GET: api/tasks [Admin]
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<TaskViewDto>>> GetAllTasks()
        {
            var taskViews = await _taskService.GetAllTasksAsync();
            return Ok(taskViews);
        }

        // GET: api/tasks/{id} [Admin]
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TaskViewDto>> GetTaskById(int id)
        {
            var taskView = await _taskService.GetTaskByIdAsync(id);

            if (taskView == null)
            {
                return NotFound($"Task with ID {id} not found.");
            }

            return Ok(taskView);
        }

        // PUT: api/tasks/{id} [Admin]
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTask(int id, TaskUpdateDto taskDto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var reason = await _taskService.UpdateTaskAsync(id, taskDto);

            switch (reason)
            {
                case ServiceErrorReason.Success:
                    return NoContent();
                case ServiceErrorReason.NotFound:
                    return NotFound($"Task with ID {id} not found.");
                case ServiceErrorReason.UserNotFound:
                    ModelState.AddModelError(nameof(taskDto.AssignedToUserId), "New assigned user not found.");
                    return ValidationProblem(ModelState);
                case ServiceErrorReason.ConcurrencyError:
                    return Conflict("The task was modified by another user. Please refresh and try again.");
                case ServiceErrorReason.DatabaseError:
                    _logger.LogError("Database error updating task {TaskId}.", id); 
                    return Problem("An error occurred while updating the task.", statusCode: StatusCodes.Status500InternalServerError);
                default:
                    _logger.LogError("Unhandled ServiceErrorReason in UpdateTask: {Reason}", reason);
                    return Problem("An unexpected error occurred.", statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // DELETE: api/tasks/{id} [Admin]
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var reason = await _taskService.DeleteTaskAsync(id);

            switch (reason)
            {
                case ServiceErrorReason.Success:
                    return NoContent();
                case ServiceErrorReason.NotFound:
                    return NotFound($"Task with ID {id} not found.");
                case ServiceErrorReason.DatabaseError:
                    _logger.LogError("Database error deleting task {TaskId}.", id); 
                    return Problem("An error occurred while deleting the task.", statusCode: StatusCodes.Status500InternalServerError);
                default:
                    _logger.LogError("Unhandled ServiceErrorReason in DeleteTask: {Reason}", reason);
                    return Problem("An unexpected error occurred.", statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // user

        // GET: api/tasks/my-tasks [User, Admin]
        [HttpGet("my-tasks")]
        [Authorize(Roles = "User, Admin")]
        public async Task<ActionResult<IEnumerable<TaskViewDto>>> GetMyTasks()
        {
            var currentUserId = GetCurrentUserId();
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("User ID claim not found."); 
            }

            var taskViews = await _taskService.GetMyTasksAsync(currentUserId);
            return Ok(taskViews);
        }

        // PATCH: api/tasks/{id}/status [User, Admin]
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "User, Admin")]
        public async Task<IActionResult> UpdateTaskStatus(int id, TaskStatusUpdateDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var currentUserId = GetCurrentUserId();
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("User ID claim not found."); 
            }

            var reason = await _taskService.UpdateTaskStatusAsync(id, currentUserId, statusDto);

            switch (reason)
            {
                case ServiceErrorReason.Success:
                    return NoContent();
                case ServiceErrorReason.NotFound:
                    return NotFound($"Task with ID {id} not found.");
                case ServiceErrorReason.Forbidden:
                    return Forbid("You are not authorized to update the status of this task.");
                case ServiceErrorReason.ConcurrencyError:
                    return Conflict("The task status was modified by another user or the task was deleted. Please refresh and try again.");
                case ServiceErrorReason.DatabaseError:
                    _logger.LogError("Database error updating status for task {TaskId}.", id); 
                    return Problem("An error occurred while updating the task status.", statusCode: StatusCodes.Status500InternalServerError);
                case ServiceErrorReason.UserNotFound: 
                    _logger.LogError("Updating user {UserId} not found when updating task {TaskId} status.", currentUserId, id);
                    return Problem("Internal user error.", statusCode: StatusCodes.Status500InternalServerError);
                default:
                    _logger.LogError("Unhandled ServiceErrorReason in UpdateTaskStatus: {Reason}", reason);
                    return Problem("An unexpected error occurred.", statusCode: StatusCodes.Status500InternalServerError);
            }
        }

        // comment

        // POST: api/tasks/{taskId}/comments [User, Admin]
        [HttpPost("{taskId}/comments")]
        [Authorize(Roles = "User, Admin")] // Both users and admins can add comments
        public async Task<ActionResult<CommentViewDto>> AddCommentToTask(int taskId, [FromBody] CommentCreateDto commentDto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var currentUserId = GetCurrentUserId();
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("User ID claim not found."); 
            }

            var (reason, createdComment) = await _taskService.AddCommentToTaskAsync(taskId, currentUserId, commentDto);

            switch (reason)
            {
                case ServiceErrorReason.Success:
                    
                    // Since comments are nested under tasks, there isn't a standard GET endpoint for a *single* comment.
                    
                    return CreatedAtAction(nameof(GetTaskById), new { id = taskId }, createdComment); 
                                                                                                      

                case ServiceErrorReason.NotFound:
                   
                    return NotFound($"Task with ID {taskId} not found.");

                case ServiceErrorReason.UserNotFound:
                    
                    _logger.LogError("Comment author user {UserId} not found.", currentUserId);
                    return Problem("An error occurred with your user account.", statusCode: StatusCodes.Status500InternalServerError);

                case ServiceErrorReason.DatabaseError:
                    _logger.LogError("Database error adding comment to task {TaskId}.", taskId);
                    return Problem("An error occurred while adding the comment.", statusCode: StatusCodes.Status500InternalServerError);

                default:
                    _logger.LogError("Unhandled ServiceErrorReason in AddCommentToTask: {Reason}", reason);
                    return Problem("An unexpected error occurred.", statusCode: StatusCodes.Status500InternalServerError);
            }
        }
    }
}