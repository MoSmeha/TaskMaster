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
import { useApi } from "../Utils/api"; // Use the useApi hook

const Register = () => {
  const [formData, setFormData] = useState({
    Username: "",
    Email: "",
    Password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register: apiRegister } = useApi(); // Get the register function from the useApi hook

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setSuccess(""); // Clear previous success
    setLoading(true);

    try {
      // Use the register function from the useApi hook
      const result = await apiRegister(formData); // This handles fetch and basic error checking

      if (result && result.isSuccess) {
        setSuccess("Registration successful! You can now log in.");
        // Optionally redirect to login after a delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(result?.message || "Registration failed."); // Fallback if not thrown
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.message || "An unexpected error occurred during registration."
      );
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
          Sign Up
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="Username"
            autoComplete="username"
            autoFocus
            value={formData.Username}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="Email"
            autoComplete="email"
            value={formData.Email}
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
            autoComplete="new-password"
            value={formData.Password}
            onChange={handleChange}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2, mb: 1 }}>
              {success}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Sign Up"}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;
