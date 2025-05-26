// src/components/admin/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTask } from "./TaskContext";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  ListAlt as TasksIcon,
  Flag as UrgentIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  AssignmentLate as OverdueIcon,
} from "@mui/icons-material";
import { format, isPast, isToday } from "date-fns";
import { Link as RouterLink } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { getAllTasks, loading, error, clearError } = useTask();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    assigned: 0,
    highUrgency: 0,
    overdue: 0,
    dueToday: 0,
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getAllTasks();
        setTasks(fetchedTasks);
        calculateStats(fetchedTasks);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      }
    };

    fetchTasks();
  }, [getAllTasks]);

  const calculateStats = (tasks) => {
    const now = new Date();

    const newStats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "Completed").length,
      inProgress: tasks.filter((t) => t.status === "InProgress").length,
      assigned: tasks.filter((t) => t.status === "Assigned").length,
      highUrgency: tasks.filter(
        (t) => t.urgency === "High" && t.status !== "Completed"
      ).length,
      overdue: tasks.filter(
        (t) =>
          t.status !== "Completed" &&
          isPast(new Date(t.dueDate)) &&
          !isToday(new Date(t.dueDate))
      ).length,
      dueToday: tasks.filter(
        (t) => t.status !== "Completed" && isToday(new Date(t.dueDate))
      ).length,
    };

    setStats(newStats);
  };

  // Find recent high urgency tasks
  const highUrgencyTasks = tasks
    .filter((t) => t.urgency === "High" && t.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  // Find overdue tasks
  const overdueTasks = tasks
    .filter(
      (t) =>
        t.status !== "Completed" &&
        isPast(new Date(t.dueDate)) &&
        !isToday(new Date(t.dueDate))
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM d");
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
          Admin Dashboard
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<TasksIcon />}
            onClick={() => navigate("/admin/tasks")}
          >
            View All Tasks
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/admin/tasks/create"
          >
            Create Task
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Task Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ height: "100%" }}>
            <Box sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
              <Typography variant="h6">Total Tasks</Typography>
            </Box>
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h3">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.completed} completed
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ height: "100%" }}>
            <Box sx={{ p: 2, bgcolor: "warning.main", color: "white" }}>
              <Typography variant="h6">In Progress</Typography>
            </Box>
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h3">{stats.inProgress}</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.assigned} waiting to start
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ height: "100%" }}>
            <Box sx={{ p: 2, bgcolor: "error.main", color: "white" }}>
              <Typography variant="h6">High Urgency</Typography>
            </Box>
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h3">{stats.highUrgency}</Typography>
              <Typography variant="body2" color="text.secondary">
                need immediate attention
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ height: "100%" }}>
            <Box sx={{ p: 2, bgcolor: "error.dark", color: "white" }}>
              <Typography variant="h6">Overdue</Typography>
            </Box>
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h3">{stats.overdue}</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.dueToday} due today
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Lists of Important Tasks */}
      <Grid container spacing={3}>
        {/* High Urgency Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <UrgentIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">High Urgency Tasks</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {highUrgencyTasks.length === 0 ? (
                <Typography color="text.secondary">
                  No high urgency tasks
                </Typography>
              ) : (
                <List dense disablePadding>
                  {highUrgencyTasks.map((task) => (
                    <ListItem
                      key={task.id}
                      button
                      onClick={() => navigate(`/admin/tasks/${task.id}`)}
                      divider
                    >
                      <ListItemIcon>
                        {task.status === "InProgress" ? (
                          <PendingIcon color="warning" />
                        ) : (
                          <UrgentIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={`Assigned to: ${
                          task.assignedToUserName
                        } • Due: ${formatDate(task.dueDate)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <OverdueIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Overdue Tasks</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {overdueTasks.length === 0 ? (
                <Typography color="text.secondary">No overdue tasks</Typography>
              ) : (
                <List dense disablePadding>
                  {overdueTasks.map((task) => (
                    <ListItem
                      key={task.id}
                      button
                      onClick={() => navigate(`/admin/tasks/${task.id}`)}
                      divider
                    >
                      <ListItemIcon>
                        <OverdueIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={`Assigned to: ${
                          task.assignedToUserName
                        } • Due: ${formatDate(task.dueDate)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
