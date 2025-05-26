import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTask } from "./TaskContext";
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
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { addDays } from "date-fns";

const CreateTask = () => {
  const navigate = useNavigate();
  const {
    createTask,
    getUrgencyLevels,
    getAssignableUsers,
    loading,
    error,
    clearError,
  } = useTask();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    urgency: "Medium",
    dueDate: addDays(new Date(), 7),
    assignedToUserId: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [urgencyLevels, setUrgencyLevels] = useState([]);
  const [users, setUsers] = useState([]);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [levels, assignees] = await Promise.all([
          getUrgencyLevels(),
          getAssignableUsers(),
        ]);
        setUrgencyLevels(levels);
        setUsers(assignees);
      } catch (err) {
        console.error(err);
        setSubmitError("Failed to load form data. Please try again.");
      }
    };
    fetchData();
  }, [getUrgencyLevels, getAssignableUsers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dueDate: date }));
    // Optional: Clear date-related form error when date changes
    if (formErrors.dueDate) {
      setFormErrors((prev) => ({ ...prev, dueDate: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.description.trim())
      errors.description = "Description is required";
    if (!formData.urgency) errors.urgency = "Urgency is required";
    // Check if dueDate is null or invalid Date object
    if (!formData.dueDate || isNaN(new Date(formData.dueDate).getTime())) {
      errors.dueDate = "Due date is required and must be a valid date";
    } else if (new Date(formData.dueDate) < new Date()) {
      // Only check against past date if a valid date is present
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Compare dates without time
      if (new Date(formData.dueDate).setHours(0, 0, 0, 0) < today.getTime()) {
        errors.dueDate = "Due date cannot be in the past";
      }
    }

    if (!formData.assignedToUserId)
      errors.assignedToUserId = "Please select a user";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSubmitError("");

    const errors = validateForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      // It might be helpful to focus the first input with an error here for better UX
      return;
    }

    // Ensure dueDate is a valid Date object before submitting
    const dataToSubmit = {
      ...formData,
      dueDate: formData.dueDate
        ? new Date(formData.dueDate).toISOString()
        : null, // Convert to ISO string or handle as needed by your API
    };

    try {
      await createTask(dataToSubmit); // Use dataToSubmit
      navigate("/admin/tasks", {
        state: {
          notification: { message: "Task created!", severity: "success" },
        },
      });
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "Failed to create task.");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Create New Task
          </Typography>

          {error && (
            <Alert severity="error" onClose={clearError}>
              {error}
            </Alert>
          )}
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError("")}>
              {submitError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
              />

              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                error={!!formErrors.description}
                helperText={formErrors.description}
                required
              />

              <FormControl fullWidth error={!!formErrors.urgency}>
                <InputLabel>Urgency</InputLabel>
                <Select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  label="Urgency"
                >
                  {urgencyLevels.map((lvl) => (
                    <MenuItem key={lvl} value={lvl}>
                      {lvl}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.urgency && (
                  <FormHelperText>{formErrors.urgency}</FormHelperText>
                )}
              </FormControl>

              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={handleDateChange}
                minDate={new Date()} // Ensure minDate is a valid Date object
                // You might consider adding a `key` prop if the DatePicker is conditionally rendered or changes frequently
                // key={formData.dueDate ? formData.dueDate.toISOString() : 'no-date'} // Example key
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true, // Mark TextField as required
                    error: !!formErrors.dueDate,
                    helperText: formErrors.dueDate,
                  },
                }}
              />

              <FormControl fullWidth error={!!formErrors.assignedToUserId}>
                <InputLabel>Assign To</InputLabel>
                <Select
                  name="assignedToUserId"
                  value={formData.assignedToUserId}
                  onChange={handleChange}
                  label="Assign To"
                  required
                >
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.userName} ({u.email})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.assignedToUserId && (
                  <FormHelperText>{formErrors.assignedToUserId}</FormHelperText>
                )}
              </FormControl>

              <Stack
                direction="row"
                spacing={2}
                justifyContent="flex-end"
                sx={{ mt: 2 }}
              >
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
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? "Creating..." : "Create Task"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default CreateTask;
