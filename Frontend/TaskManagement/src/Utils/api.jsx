// src/api/api.js
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { useMemo, useCallback } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:7035";

export const useApi = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const request = useCallback(
    async (method, url, data = null, requiresAuth = false) => {
      const headers = {
        "Content-Type": "application/json",
      };

      if (requiresAuth) {
        if (!token) {
          console.error("Authentication required but no token available.");
          logout();
          navigate("/login");
          const error = new Error("Authentication required.");
          error.statusCode = 401;
          throw error;
        }
        headers["Authorization"] = `Bearer ${token}`;
      }

      const config = {
        method,
        headers,
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);

        // Handle 401 and 403 specifically before attempting to read body
        if (response.status === 401 && requiresAuth) {
          console.warn("Unauthorized API request. Redirecting to login.");
          logout();
          navigate("/login");
          const error = new Error("Unauthorized access. Please log in again.");
          error.statusCode = 401;
          throw error; // Throw to stop further processing
        }

        if (response.status === 403 && requiresAuth) {
          console.warn("Forbidden API request. Redirecting to home.");
          navigate("/"); // Or another appropriate page
          const error = new Error("Access forbidden.");
          error.statusCode = 403;
          throw error; // Throw to stop further processing
        }

        if (!response.ok) {
          // Clone the response so we can attempt to read the body potentially multiple times
          // (once as JSON, once as text if JSON fails)
          const errorResponseClone = response.clone();
          let errorDetail = "Failed to parse error response."; // Default message if body is unreadable

          try {
            // Attempt to read the body as JSON first
            const jsonBody = await response.json();
            // If JSON parsing succeeds, check for a common error message property
            if (
              jsonBody &&
              typeof jsonBody === "object" &&
              (jsonBody.message || jsonBody.errors)
            ) {
              // Prioritize a 'message' field if present
              errorDetail = jsonBody.message || JSON.stringify(jsonBody.errors);
            } else {
              // If JSON structure is unexpected, stringify the whole JSON body
              errorDetail = `Unexpected error format: ${JSON.stringify(
                jsonBody
              )}`;
            }
          } catch (jsonError) {
            // If JSON parsing fails, try reading the body as plain text
            try {
              errorDetail = await errorResponseClone.text();
              // Limit the text length in the console/error message to avoid massive outputs
              if (errorDetail.length > 500) {
                errorDetail = errorDetail.substring(0, 500) + "... (truncated)";
              }
              // If the text is empty or just whitespace, provide a generic message
              if (!errorDetail.trim()) {
                errorDetail = response.statusText || "Unknown Error";
              }
            } catch (textError) {
              console.error("Failed to read response body as text:", textError);
              errorDetail = "Could not read response body.";
            }
            console.warn(
              "Error response was likely not JSON or had unexpected structure:",
              jsonError
            );
          }

          // Create and throw a new Error with the status code and extracted detail
          const apiError = new Error(
            `API Error ${response.status}: ${errorDetail}`
          );
          apiError.statusCode = response.status;
          // Optionally attach the original response or parsed body for more context if needed later
          // apiError.response = response;
          // apiError.responseBody = jsonBody || errorDetail;
          throw apiError;
        }

        // Handle 204 No Content specifically
        if (response.status === 204) {
          return null;
        }

        // For all other successful responses (2xx) with content
        // Ensure content-length header check for truly empty bodies if needed,
        // but response.json() will likely handle an empty body correctly for 200/201.
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        } else {
          // Handle non-JSON success responses if necessary, or return null/throw
          console.warn(
            `API Success Response: Expected JSON but received ${contentType}`
          );
          // Depending on your API, you might return response.text() or null here.
          // For a JSON API, this might indicate an unexpected server response.
          // Decide on the appropriate handling. Returning null as a fallback for unexpected types:
          return null;
        }
      } catch (error) {
        // This catch block handles network errors or errors re-thrown from the above block (including our custom apiError)
        console.error("Fetch request failed:", error);
        // If the error object already has a statusCode, it's likely one of our custom errors, re-throw it.
        // Otherwise, it's a network error or unexpected exception.
        if (error.statusCode) {
          throw error; // Re-throw the custom API error
        } else {
          // Wrap other errors (like network errors) in a consistent format
          const networkError = new Error(
            `Network error: ${error.message || "Could not connect to API"}`
          );
          // Optionally copy properties from the original error if helpful for debugging
          // networkError.originalError = error;
          throw networkError;
        }
      }
    },
    [token, logout, navigate]
  );

  const api = useMemo(() => {
    return {
      register: (data) => request("POST", "/api/auth/register", data),
      login: (data) => request("POST", "/api/auth/login", data),
      getUserProfile: () => request("GET", "/api/user/profile", null, true),
      getUserSpecificData: () =>
        request("GET", "/api/user/user-specific-data", null, true),
      getAdminData: () =>
        request("GET", "/api/dashboard/admin-data", null, true),

      // --- Note API Calls ---
      getNotes: () => request("GET", "/api/notes", null, true),
      getNoteById: (id) => request("GET", `/api/notes/${id}`, null, true),
      createNote: (noteData) => request("POST", "/api/notes", noteData, true),
      updateNote: (id, noteData) =>
        request("PUT", `/api/notes/${id}`, noteData, true),
      deleteNote: (id) => request("DELETE", `/api/notes/${id}`, null, true),
      // --- End Note API Calls ---
    };
  }, [request]);

  return api;
};

