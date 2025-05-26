import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    // Redirect unauthenticated users to the login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Check if the user has at least one of the required roles
    const userHasRequiredRole = allowedRoles.some((role) => hasRole(role));
    if (!userHasRequiredRole) {
      // Redirect users without the required role
      // You might have a specific "Forbidden" page, or just redirect home
      return <Navigate to="/" replace />; // Redirect home
    }
  }

  // If authenticated and has required roles (or no specific roles required), render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
