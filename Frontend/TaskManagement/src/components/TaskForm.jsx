import React, { useEffect, useState } from "react";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  LinearProgress,
  Alert,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";

const TaskForm = ({ open, handleClose, task, users = [] }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    urgency: "Low",
    dueDate: new Date(),
    assignedToUserId: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        urgency: task.urgency,
        dueDate: new Date(task.dueDate),
        assignedToUserId: task.assignedToUserId,
      });
    } else {
      // Reset form when creating new task
      setFormData({
        title: "",
        description: "",
        urgency: "Low",
        dueDate: new Date(),
        assignedToUserId: "",
      });
    }
    setErrors({});
    setSubmitError("");
  }, [task, open]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.assignedToUserId)
      newErrors.assignedToUserId = "User is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
    const method = task ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate.toISOString(),
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || "Request failed");
      }

      try {
        const data = JSON.parse(responseText);
        handleClose(true);
      } catch (e) {
        // Handle successful response that's not JSON
        handleClose(true);
      }
    } catch (error) {
      console.error("Error saving task:", error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => handleClose(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
      <DialogContent>
        {isSubmitting && <LinearProgress />}
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <TextField
          fullWidth
          margin="normal"
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={!!errors.title}
          helperText={errors.title}
          disabled={isSubmitting}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Description"
          multiline
          rows={4}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isSubmitting}
        />
        <FormControl fullWidth margin="normal" error={!!errors.urgency}>
          <InputLabel>Urgency</InputLabel>
          <Select
            value={formData.urgency}
            label="Urgency"
            onChange={(e) =>
              setFormData({ ...formData, urgency: e.target.value })
            }
            disabled={isSubmitting}
          >
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </Select>
        </FormControl>
        <DateTimePicker
          label="Due Date"
          value={formData.dueDate}
          onChange={(newValue) =>
            setFormData({ ...formData, dueDate: newValue })
          }
          renderInput={(params) => (
            <TextField
              fullWidth
              margin="normal"
              {...params}
              disabled={isSubmitting}
            />
          )}
          disabled={isSubmitting}
        />
        <FormControl
          fullWidth
          margin="normal"
          error={!!errors.assignedToUserId}
        >
          <InputLabel>Assign To</InputLabel>
          <Select
            value={formData.assignedToUserId}
            label="Assign To"
            onChange={(e) =>
              setFormData({ ...formData, assignedToUserId: e.target.value })
            }
            disabled={isSubmitting || users.length === 0}
          >
            {users.length === 0 ? (
              <MenuItem disabled>Loading users...</MenuItem>
            ) : (
              users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.userName} ({user.email})
                </MenuItem>
              ))
            )}
          </Select>
          {errors.assignedToUserId && (
            <FormHelperText>{errors.assignedToUserId}</FormHelperText>
          )}
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskForm;
