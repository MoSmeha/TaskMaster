import React, { useEffect, useState, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Box,
  Typography,
  Button,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ViewIcon from "@mui/icons-material/Visibility";
import FlagIcon from "@mui/icons-material/Flag";
import CompleteIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CommentIcon from "@mui/icons-material/Comment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SendIcon from "@mui/icons-material/Send";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TaskIcon from "@mui/icons-material/Task";

import { useTask } from "./TaskContext";

const AdminTasksManagement = () => {
  const { getAllTasks, deleteTask, addComment, loading, error, clearError } =
    useTask();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [newCommentText, setNewCommentText] = useState({});
  const [addingComment, setAddingComment] = useState({});
  const [commentError, setCommentError] = useState({});

  useEffect(() => {
    const fetchTasks = async () => {
      clearError();
      try {
        const fetchedTasks = await getAllTasks();
        setTasks(fetchedTasks);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      }
    };

    fetchTasks();
  }, [getAllTasks, clearError]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    setExpandedTaskId(null);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setExpandedTaskId(null);
  };

  const openDeleteDialog = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    const idToDelete = taskToDelete.id;
    const titleToDelete = taskToDelete.title;

    setDeleteDialogOpen(false);
    setTaskToDelete(null);

    try {
      await deleteTask(idToDelete);
      setTasks(tasks.filter((task) => task.id !== idToDelete));
      setNewCommentText((prev) => {
        delete prev[idToDelete];
        return { ...prev };
      });
      setAddingComment((prev) => {
        delete prev[idToDelete];
        return { ...prev };
      });
      setCommentError((prev) => {
        delete prev[idToDelete];
        return { ...prev };
      });
      if (expandedTaskId === idToDelete) {
        setExpandedTaskId(null);
      }

      setNotification({
        open: true,
        message: `Task "${titleToDelete}" deleted successfully!`,
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to delete task", err);
      const deleteErrorMessage =
        error || `Error deleting task "${titleToDelete}"`;
      setNotification({
        open: true,
        message: deleteErrorMessage,
        severity: "error",
      });
    }
  };

  const handleToggleExpand = useCallback(
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
        setCommentError((prev) => ({
          ...prev,
          [taskId]: "Comment cannot be empty.",
        }));
        return;
      }

      setAddingComment((prev) => ({ ...prev, [taskId]: true }));
      setCommentError((prev) => ({ ...prev, [taskId]: null }));

      try {
        const addedComment = await addComment(taskId, commentText);

        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  comments: [...(task.comments || []), addedComment],
                }
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
        const addCommentErrorMessage =
          error || err.message || "Failed to add comment.";
        setCommentError((prev) => ({
          ...prev,
          [taskId]: addCommentErrorMessage,
        }));
        setNotification({
          open: true,
          message: addCommentErrorMessage,
          severity: "error",
        });
      } finally {
        setAddingComment((prev) => ({ ...prev, [taskId]: false }));
      }
    },
    [newCommentText, addComment, error]
  );

  const formatCommentDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "PPP, p");
    } catch (e) {
      return "Invalid date";
    }
  };

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
        return <AssignmentIcon fontSize="small" />;
      default:
        return <TaskIcon fontSize="small" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PP");
    } catch (e) {
      return "Invalid date";
    }
  };

  const tableHeaderCellsCount = 7;

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
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Task Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/admin/tasks/create"
        >
          Create New Task
        </Button>
      </Box>

      {error && tasks.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {tasks.length === 0 && !loading && !error ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6">No tasks found</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/admin/tasks/create"
            sx={{ mt: 2 }}
          >
            Create your first task
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Urgency</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((task) => (
                    <React.Fragment key={task.id}>
                      <TableRow hover>
                        <TableCell>{task.id}</TableCell>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          {task.assignedToUserName || "Unassigned"}
                        </TableCell>
                        <TableCell>{formatDate(task.dueDate)}</TableCell>
                        <TableCell>
                          <Chip
                            icon={<FlagIcon fontSize="small" />}
                            label={task.urgency}
                            color={getUrgencyColor(task.urgency)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(task.status)}
                            label={task.status}
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box
                            sx={{ display: "flex", justifyContent: "flex-end" }}
                          >
                            <Tooltip
                              title={`${
                                expandedTaskId === task.id ? "Hide" : "Show"
                              } Comments`}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleToggleExpand(task.id)}
                                aria-expanded={expandedTaskId === task.id}
                                aria-label="show comments"
                              >
                                {expandedTaskId === task.id ? (
                                  <ExpandMoreIcon fontSize="small" />
                                ) : (
                                  <ChevronRightIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  navigate(`/admin/tasks/${task.id}`)
                                }
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() =>
                                  navigate(`/admin/tasks/${task.id}`)
                                }
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteDialog(task)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={tableHeaderCellsCount}
                        >
                          <Collapse
                            in={expandedTaskId === task.id}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box
                              sx={{
                                margin: 1,
                                p: 2,
                                border: "1px dashed #ddd",
                                borderRadius: 1,
                              }}
                            >
                              <Typography
                                variant="h6"
                                gutterBottom
                                component="div"
                              >
                                Comments ({task.comments?.length || 0})
                              </Typography>
                              <List
                                dense
                                sx={{
                                  maxHeight: 200,
                                  overflowY: "auto",
                                  pr: 1,
                                }}
                              >
                                {task.comments && task.comments.length > 0 ? (
                                  task.comments.map((comment, commentIndex) => (
                                    <React.Fragment
                                      key={
                                        comment.id || `comment-${commentIndex}`
                                      }
                                    >
                                      <ListItem
                                        alignItems="flex-start"
                                        sx={{ py: 0.5 }}
                                      >
                                        <ListItemText
                                          primary={
                                            <Typography
                                              variant="body2"
                                              sx={{ whiteSpace: "pre-line" }}
                                            >
                                              {comment.text}
                                            </Typography>
                                          }
                                          secondary={
                                            <Typography
                                              sx={{ display: "block" }}
                                              component="span"
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              <strong>
                                                {comment.authorUserName ||
                                                  "Unknown User"}
                                              </strong>{" "}
                                              on{" "}
                                              {formatCommentDate(
                                                comment.createdAt
                                              )}
                                            </Typography>
                                          }
                                        />
                                      </ListItem>
                                      {commentIndex <
                                        task.comments.length - 1 && (
                                        <Divider
                                          component="li"
                                          variant="inset"
                                        />
                                      )}{" "}
                                    </React.Fragment>
                                  ))
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ml: 2 }}
                                  >
                                    No comments yet.
                                  </Typography>
                                )}
                              </List>

                              <Divider sx={{ my: 2 }} />

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
                                  rows={2}
                                  value={newCommentText[task.id] || ""}
                                  onChange={(e) =>
                                    handleNewCommentChange(
                                      task.id,
                                      e.target.value
                                    )
                                  }
                                  disabled={addingComment[task.id]}
                                  error={!!commentError[task.id]}
                                  helperText={commentError[task.id]}
                                  onFocus={() =>
                                    setCommentError((prev) => ({
                                      ...prev,
                                      [task.id]: null,
                                    }))
                                  }
                                />
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  sx={{ height: "40px", flexShrink: 0 }}
                                  onClick={() => handleAddComment(task.id)}
                                  disabled={
                                    addingComment[task.id] ||
                                    !newCommentText[task.id]?.trim()
                                  }
                                >
                                  {addingComment[task.id] ? (
                                    <CircularProgress
                                      size={20}
                                      color="inherit"
                                    />
                                  ) : (
                                    <SendIcon />
                                  )}
                                </Button>
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={tasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the task "
            {taskToDelete?.title || "this task"}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteTask}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default AdminTasksManagement;
