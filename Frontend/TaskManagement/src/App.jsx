// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Utils/AuthContext";
import { TaskProvider } from "./components/TaskContext";
import ProtectedRoute from "./Utils/ProtectedRoute";
import CssBaseline from "@mui/material/CssBaseline";
import Navbar from "./components/Navbar";

// Auth Components
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";

// User Components
import UserTasks from "./components/UserTasks";
import UserSpecific from "./components/UserSpecific"; // Your existing component
import NotesPage from "./components/NotesPage"; // Your existing component

// Admin Components
import AdminDashboard from "./components/AdminDashboard";
import AdminTasksManagement from "./components/AdminTasksManagement";
import CreateTask from "./components/CreateTask";
import EditTask from "./components/EditTask";

function App() {
  return (
    <Router>
      <AuthProvider>
        <TaskProvider>
          <CssBaseline /> {/* Apply basic CSS reset from MUI */}
          <Navbar /> {/* Add the navigation bar */}
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    maxWidth: "800px",
                    margin: "0 auto",
                  }}
                >
                  <h1>Welcome to Task Management System</h1>
                </div>
              }
            />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-tasks" element={<UserTasks />} />
            </Route>

            {/* User specific routes */}
            <Route element={<ProtectedRoute allowedRoles={["User"]} />}>
              <Route path="/notes" element={<NotesPage />} />
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/tasks" element={<AdminTasksManagement />} />
              <Route path="/admin/tasks/create" element={<CreateTask />} />
              <Route path="/admin/tasks/:id" element={<EditTask />} />
            </Route>

            {/* Catch-all for unknown routes */}
            <Route
              path="*"
              element={
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <h1>404 - Not Found</h1>
                  <p>The page you are looking for does not exist.</p>
                </div>
              }
            />
          </Routes>
        </TaskProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
