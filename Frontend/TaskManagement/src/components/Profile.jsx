import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "../Utils/AuthContext";
import { useApi } from "../Utils/api"; // Use the useApi hook

const Profile = () => {
  const { user } = useAuth(); // Get user data from context
  const { getUserProfile: apiGetUserProfile } = useApi(); // Get the API function
  const [profileData, setProfileData] = useState(null); // State for fetched profile data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setError("");
      setLoading(true);
      try {
        // Call the API function requiring authentication
        // useApi handles adding the token and redirecting on 401/403
        const data = await apiGetUserProfile();
        setProfileData(data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // The useApi hook already handles redirection for 401/403
        // For other errors (like network issues or 500), display a message
        if (err.statusCode !== 401 && err.statusCode !== 403) {
          setError(err.message || "Failed to load profile data.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch data when the component mounts or user changes (though user change might cause re-mount anyway)
    if (user) {
      // Only fetch if a user is logged in (ProtectedRoute should ensure this)
      fetchProfile();
    } else {
      setLoading(false); // Should not happen with ProtectedRoute
    }
  }, [user, apiGetUserProfile]); // Dependency array: re-run effect if user or apiGetUserProfile changes

  if (!user) {
    // Should be handled by ProtectedRoute, but a fallback is good
    return <Typography>Please log in to view your profile.</Typography>;
  }

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6">
            Username: {profileData?.Username || user.username}
          </Typography>
          <Typography variant="h6">
            Email: {profileData?.Email || user.email}
          </Typography>
          <Typography variant="h6">
            User ID: {profileData?.UserId || user.userId}
          </Typography>
          <Typography variant="h6">
            Roles: {profileData?.Roles?.join(", ") || user.roles?.join(", ")}
          </Typography>
          {/* Display the message from the API response if available */}
          {profileData?.Message && (
            <Typography variant="body1" sx={{ mt: 2, fontStyle: "italic" }}>
              API Message: {profileData.Message}
            </Typography>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default Profile;
