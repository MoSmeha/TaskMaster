import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useApi } from "../Utils/api"; // Use the useApi hook

const UserSpecific = () => {
  const { getUserSpecificData: apiGetUserSpecificData } = useApi(); // Get the API function
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setError("");
      setLoading(true);
      try {
        // Call the API function requiring authentication and User role
        const data = await apiGetUserSpecificData();
        setUserData(data);
      } catch (err) {
        console.error("Failed to fetch user-specific data:", err);
        // The useApi hook already handles redirection for 401/403
        if (err.statusCode !== 401 && err.statusCode !== 403) {
          setError(err.message || "Failed to load user-specific data.");
        }
        // Note: For 403, useApi redirects.
      } finally {
        setLoading(false);
      }
    };

    fetchData(); // Fetch data when component mounts
  }, [apiGetUserSpecificData]); // Dependency array

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Specific Data
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper elevation={3} sx={{ p: 3 }}>
          {userData?.Message ? (
            <Typography variant="body1">{userData.Message}</Typography>
          ) : (
            <Typography variant="body1">
              No user specific data received.
            </Typography>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default UserSpecific;
