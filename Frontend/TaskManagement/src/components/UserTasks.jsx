// src/components/tasks/UserTasks.js
import React, { useEffect, useState, useCallback } from "react";
import { useTask } from "./TaskContext";
import { useAuth } from "../Utils/AuthContext";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  TextField,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  AccessTime as TimeIcon,
  Flag as FlagIcon,
  CheckCircle as CompleteIcon,
  Pending as PendingIcon,
  Assignment as TaskIcon,
  Block as BlockIcon,
  Comment as CommentIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

const UserTasks = () => {
  const {
    getMyTasks,
    updateTaskStatus,
    getStatusLevels,
    addComment,
    loading,
    error,
    clearError,
  } = useTask();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusOptions, setStatusOptions] = useState([]);

  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [newCommentText, setNewCommentText] = useState({});
  const [addingComment, setAddingComment] = useState({});
  const [commentError, setCommentError] = useState({});

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchTasksAndStatuses = async () => {
      clearError();
      try {
        const [fetchedTasks, fetchedStatuses] = await Promise.all([
          getMyTasks(),
          getStatusLevels(),
        ]);

        // Ensure comments array exists for each task
        const tasksWithComments = fetchedTasks.map((task) => ({
          ...task,
          comments: task.comments || [],
        }));

        setTasks(tasksWithComments);
        setStatusOptions(fetchedStatuses);
      } catch (err) {
        console.error("Failed to fetch tasks or status levels", err);
      }
    };

    fetchTasksAndStatuses();
  }, [getMyTasks, getStatusLevels, clearError]);

  const handleStatusChange = (task) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setStatusDialog(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedTask || !newStatus) return;

    setStatusDialog(false);
    const taskToUpdateId = selectedTask.id;
    const statusToUpdate = newStatus;
    const originalTask = selectedTask; // Store original task to revert on error
    setSelectedTask(null); // Clear selected task immediately
    setNewStatus(""); // Clear new status immediately

    // Optimistically update the UI
    setTasks(
      tasks.map((task) =>
        task.id === taskToUpdateId ? { ...task, status: statusToUpdate } : task
      )
    );

    try {
      await updateTaskStatus(taskToUpdateId, statusToUpdate);

      setNotification({
        open: true,
        message: "Task status updated successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to update task status", err);
      // Revert the UI update on error
      setTasks(
        tasks.map((task) => (task.id === taskToUpdateId ? originalTask : task))
      );
      setNotification({
        open: true,
        message: error || "Failed to update task status",
        severity: "error",
      });
    }
  };

  const handleToggleComments = useCallback(
    (taskId) => {
      setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    },
    [expandedTaskId]
  );

  const handleNewCommentChange = useCallback((taskId, text) => {
    setNewCommentText((prev) => ({ ...prev, [taskId]: text }));
  }, []);

  const handleAddComment = useCallback(
    async (taskId) => {
      const commentText = newCommentText[taskId]?.trim();

      if (!commentText) {
        setNotification({
          open: true,
          message: "Comment cannot be empty.",
          severity: "warning",
        });
        return;
      }

      setAddingComment((prev) => ({ ...prev, [taskId]: true }));
      setCommentError((prev) => ({ ...prev, [taskId]: null }));

      try {
        const addedComment = await addComment(taskId, commentText);

        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? { ...task, comments: [...(task.comments || []), addedComment] }
              : task
          )
        );

        setNewCommentText((prev) => ({ ...prev, [taskId]: "" }));

        setNotification({
          open: true,
          message: "Comment added successfully!",
          severity: "success",
        });
      } catch (err) {
        console.error(`Failed to add comment to task ${taskId}`, err);
        setCommentError((prev) => ({
          ...prev,
          [taskId]: err.message || "Failed to add comment.",
        }));
        setNotification({
          open: true,
          message: err.message || "Failed to add comment.",
          severity: "error",
        });
      } finally {
        setAddingComment((prev) => ({ ...prev, [taskId]: false }));
      }
    },
    [newCommentText, addComment]
  );

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Low":
        return "success";
      case "Medium":
        return "warning";
      case "High":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "info";
      case "InProgress":
        return "warning";
      case "Completed":
        return "success";
      case "Blocked":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CompleteIcon fontSize="small" />;
      case "InProgress":
        return <PendingIcon fontSize="small" />;
      case "Blocked":
        return <BlockIcon fontSize="small" />; //
      default:
        return <TaskIcon fontSize="small" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };

  const formatCommentDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "MMM d, yyyy, p");
    } catch (e) {
      return "Invalid date";
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && error && tasks.length === 0) {
    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Box>
    );
  }
  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2 }}>
        My Tasks
      </Typography>

      {error && tasks.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {tasks.length === 0 && !loading && !error ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6">You have no assigned tasks!</Typography>
        </Paper>
      ) : (
        <Box sx={{ width: "100%" }}>
          {tasks.map((task) => (
            <Box key={task.id} sx={{ mb: 2, width: "100%" }}>
              {" "}
              {/* Reduced bottom margin */}
              <Card
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderLeft: 6,
                  borderColor:
                    task.status === "Completed"
                      ? "success.main"
                      : task.status === "Blocked"
                      ? "error.dark"
                      : task.urgency === "High"
                      ? "error.main"
                      : task.urgency === "Medium"
                      ? "warning.main"
                      : "success.main",
                  boxShadow: 3, // added shadow
                }}
              >
                <CardContent sx={{ flexGrow: 1, py: 1, pb: 0 }}>
                  {" "}
                  {/* Reduced padding-top and padding-bottom */}
                  <Typography
                    variant="h6"
                    component="h2"
                    gutterBottom
                    sx={{ mb: 1 }}
                  >
                    {" "}
                    {/* Reduced bottom margin */}
                    {task.title}
                  </Typography>
                  <Box
                    sx={{ mb: 1, display: "flex", gap: 1, flexWrap: "wrap" }} // Reduced bottom margin
                  >
                    <Chip
                      icon={<FlagIcon fontSize="small" />}
                      label={task.urgency}
                      color={getUrgencyColor(task.urgency)}
                      size="small"
                    />
                    <Chip
                      icon={getStatusIcon(task.status)}
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                    sx={{ whiteSpace: "pre-line", mb: 1 }} // Reduced bottom margin
                  >
                    {task.description}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    {" "}
                    {/* Reduced bottom margin */}
                    <TimeIcon
                      fontSize="small"
                      sx={{ mr: 1, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Due: {formatDate(task.dueDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    {" "}
                    {/* Reduced top margin */}
                    <Divider sx={{ mb: 1 }} /> {/* Reduced bottom margin */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        "&:hover": { opacity: 0.8 },
                      }}
                      onClick={() => handleToggleComments(task.id)}
                    >
                      <CommentIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        Comments ({task.comments?.length || 0})
                      </Typography>
                      <IconButton size="small">
                        {expandedTaskId === task.id ? (
                          <ExpandMoreIcon fontSize="small" />
                        ) : (
                          <ChevronRightIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={expandedTaskId === task.id}>
                      <Box sx={{ mt: 1 }}>
                        {" "}
                        {/* Reduced top margin */}
                        {task.comments && task.comments.length > 0 ? (
                          <Box
                            sx={{
                              maxHeight: 120, // Slightly reduced max height for comments
                              overflowY: "auto",
                              pr: 1,
                              mb: 1, // Reduced bottom margin
                            }}
                          >
                            {task.comments.map((comment) => (
                              <Box
                                key={comment.id}
                                sx={{
                                  mb: 0.5, // Reduced bottom margin
                                  pb: 0.5, // Reduced bottom padding
                                  borderBottom: "1px dashed #eee",
                                  "&:last-child": { borderBottom: "none" },
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  <strong>{comment.authorUserName}</strong> on{" "}
                                  {formatCommentDate(comment.createdAt)}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ whiteSpace: "pre-line" }}
                                >
                                  {comment.text}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }} // Reduced bottom margin
                          >
                            No comments yet.
                          </Typography>
                        )}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <TextField
                            label="Add a comment"
                            variant="outlined"
                            size="small"
                            fullWidth
                            multiline
                            rows={1} // Reduced default rows
                            maxRows={3} // Added max rows to prevent excessive growth
                            value={newCommentText[task.id] || ""}
                            onChange={(e) =>
                              handleNewCommentChange(task.id, e.target.value)
                            }
                            disabled={addingComment[task.id]}
                            sx={{ ".MuiInputBase-input": { py: "8.5px" } }} // Adjusted padding for small size
                          />
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            sx={{ height: "38px", flexShrink: 0 }} // Adjusted height
                            onClick={() => handleAddComment(task.id)}
                            disabled={
                              addingComment[task.id] ||
                              !newCommentText[task.id]?.trim()
                            }
                          >
                            {addingComment[task.id] ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <SendIcon fontSize="small" />
                            )}
                          </Button>
                        </Box>
                        {commentError[task.id] && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ mt: 0.5, display: "block" }}
                          >
                            {commentError[task.id]}
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                </CardContent>

                <CardActions sx={{ pt: 0.5, pb: 1, px: 2 }}>
                  {" "}
                  {/* Reduced padding */}
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleStatusChange(task)}
                    disabled={task.status === "Completed" || loading}
                    color={task.status === "Completed" ? "success" : "primary"}
                    fullWidth
                  >
                    {loading && selectedTask?.id === task.id ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : task.status === "Completed" ? (
                      "Completed"
                    ) : (
                      "Update Status"
                    )}
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {selectedTask && (
        <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
          <DialogTitle>Update Task Status</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Update the status for task: <strong>{selectedTask.title}</strong>
            </DialogContentText>
            <FormControl fullWidth>
              <InputLabel id="new-status-label">Status</InputLabel>
              <Select
                labelId="new-status-label"
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              variant="contained"
              disabled={loading || newStatus === selectedTask.status}
            >
              {loading && selectedTask?.id === selectedTask.id ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Update"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserTasks;
