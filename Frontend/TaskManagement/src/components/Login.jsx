import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Utils/AuthContext";
import { useApi } from "../Utils/api"; // Use the useApi hook

const Login = () => {
  const [formData, setFormData] = useState({
    UsernameOrEmail: "",
    Password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { login: apiLogin } = useApi(); // Get the login function from the useApi hook

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true);

    try {
      // Use the login function from the useApi hook
      const result = await apiLogin(formData); // This handles fetch and basic error checking

      if (result && result.isSuccess) {
        login(result); // Update AuthContext state and localStorage
        navigate("/profile"); // Redirect to profile page on success
      } else {
        // API returned a non-success result (handled by useApi throwing errors now)
        // If useApi didn't throw, we would check result.message here
        // But with the current useApi, non-success results are thrown as errors.
        setError(result?.message || "Login failed."); // Fallback if somehow not thrown
      }
    } catch (err) {
      console.error("Login error:", err);
      // Display the error message from the thrown error
      setError(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="usernameOrEmail"
            label="Username or Email"
            name="UsernameOrEmail"
            autoComplete="email" // or username
            autoFocus
            value={formData.UsernameOrEmail}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="Password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.Password}
            onChange={handleChange}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Sign In"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
