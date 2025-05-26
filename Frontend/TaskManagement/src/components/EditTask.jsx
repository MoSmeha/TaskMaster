// src/components/admin/EditTask.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTask } from "./TaskContext"; // Corrected path
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getTaskById,
    updateTask,
    getUrgencyLevels,
    getAssignableUsers,
    getStatusLevels,
    loading,
    error,
    clearError,
    urgencyLevels: cachedUrgencyLevels,
    assignableUsers: cachedAssignableUsers,
  } = useTask();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    urgency: "",
    dueDate: null,
    assignedToUserId: "",
    status: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [statusLevels, setStatusLevels] = useState([]); // Local state for status options

  // Fetch task data and dropdown options on component mount
  useEffect(() => {
    const fetchData = async () => {
      clearError();

      try {
        const [task, levels, users, statuses] = await Promise.all([
          getTaskById(id),
          getUrgencyLevels(),
          getAssignableUsers(),
          getStatusLevels(),
        ]);

        setFormData({
          title: task.title || "",
          description: task.description || "",
          urgency: task.urgency || "",
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          assignedToUserId: task.assignedToUserId || "",
          status: task.status || "", // Assumes task.status is already the string value
        });

        // Store status levels locally for the dropdown
        setStatusLevels(statuses);
      } catch (err) {
        console.error("Error fetching initial data for EditTask:", err);
        // Error is set in context
      }
    };

    fetchData();
  }, [
    id,
    getTaskById,
    getUrgencyLevels,
    getAssignableUsers,
    getStatusLevels,
    clearError,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      dueDate: newDate,
    });

    if (formErrors.dueDate) {
      setFormErrors({
        ...formErrors,
        dueDate: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    if (!formData.urgency) {
      errors.urgency = "Urgency level is required";
    }

    if (!formData.dueDate) {
      errors.dueDate = "Due date is required";
    } else if (isNaN(formData.dueDate.getTime())) {
      errors.dueDate = "Invalid date";
    }

    if (!formData.assignedToUserId) {
      errors.assignedToUserId = "Please select a user to assign this task";
    }

    // This validation still makes sense to ensure *some* status is selected
    // even if the user were somehow able to clear the pre-filled value.
    if (!formData.status) {
      errors.status = "Status is required";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await updateTask(id, formData);

      navigate("/admin/tasks", {
        state: {
          notification: {
            message: "Task updated successfully!",
            severity: "success",
          },
        },
      });
    } catch (err) {
      console.error("Error updating task:", err);
      // Error is set in context
    }
  };

  const formatDateDisplay = (date) => {
    if (!date) return "";
    try {
      return format(new Date(date), "PP");
    } catch (e) {
      return "Invalid date";
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

  if (loading && formData.title === "") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && error && formData.title === "") {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={() => navigate("/admin/tasks")}
        >
          Back to Tasks
        </Button>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h4" component="h1">
            Edit Task
          </Typography>
          {formData.status && (
            <Chip
              label={formData.status}
              color={getStatusColor(formData.status)}
              variant="outlined"
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container direction="column" rowSpacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  required
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.urgency}>
                  <InputLabel>Urgency Level</InputLabel>
                  <Select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    label="Urgency Level"
                    required
                  >
                    {cachedUrgencyLevels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.urgency && (
                    <FormHelperText>{formErrors.urgency}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!formErrors.dueDate,
                      helperText: formErrors.dueDate,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.assignedToUserId}>
                  <InputLabel>Assign To</InputLabel>
                  <Select
                    name="assignedToUserId"
                    value={formData.assignedToUserId}
                    onChange={handleChange}
                    label="Assign To"
                    required
                  >
                    <MenuItem value="">
                      <em>Select User</em>
                    </MenuItem>
                    {cachedAssignableUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.userName} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.assignedToUserId && (
                    <FormHelperText>
                      {formErrors.assignedToUserId}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                    required
                  >
                    {statusLevels.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.status && (
                    <FormHelperText>{formErrors.status}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {formatDateDisplay(new Date())}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate("/admin/tasks")}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={
                        loading ? <CircularProgress size={20} /> : null
                      }
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default EditTask;
