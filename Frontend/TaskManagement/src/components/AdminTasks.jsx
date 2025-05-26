import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import TaskForm from "./TaskForm";

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Handle non-JSON responses first
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
      }

      try {
        const data = JSON.parse(text);
        setTasks(data);
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      console.error("Fetch tasks error:", err);
      setError(err.message);
      console.debug("Auth token exists:", !!localStorage.getItem("token"));
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Button
        variant="contained"
        onClick={() => setOpenForm(true)}
        sx={{ mb: 2 }}
      >
        Create Task
      </Button>

      {loading && <CircularProgress />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Urgency</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.title}</TableCell>
                <TableCell>{task.assignedToUserName}</TableCell>
                <TableCell>{task.urgency}</TableCell>
                <TableCell>
                  {new Date(task.dueDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{task.status}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => {
                      setSelectedTask(task);
                      setOpenForm(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(task.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TaskForm
        open={openForm}
        handleClose={(refresh) => {
          setOpenForm(false);
          setSelectedTask(null);
          if (refresh) fetchTasks();
        }}
        task={selectedTask}
        users={users}
      />
    </div>
  );
};

export default AdminTasks;
