// src/contexts/TaskContext.js
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { useAuth } from "../Utils/AuthContext"; // Ensure this path is correct

const TaskContext = createContext();
export const useTask = () => useContext(TaskContext);

// Consistent string-to-integer mapping for UrgencyLevel enum
const urgencyStringToIntMap = {
  Low: 0,
  Medium: 1,
  High: 2,
  // Add other levels if your API and UrgencyLevel enum support them
};

// Consistent string-to-integer mapping for TaskCompletionStatus enum
const taskStatusStringToIntMap = {
  Assigned: 0,
  InProgress: 1,
  Completed: 2,
  Blocked: 3,
  // Add other statuses if your API and TaskCompletionStatus enum support them
};

// Helper function for robust error message extraction
const extractErrorMessage = (
  err,
  defaultMessage = "An unexpected error occurred."
) => {
  let errorMessage = defaultMessage;
  if (err.response && err.response.data) {
    if (
      typeof err.response.data === "string" &&
      err.response.data.startsWith("<!DOCTYPE html>")
    ) {
      // Handle HTML error pages (e.g., from some proxy errors or unhandled server exceptions)
      errorMessage = `Server returned an HTML error page (Status: ${err.response.status}). Check server logs.`;
    } else if (err.response.data.errors) {
      const validationErrors = err.response.data.errors;
      let errorMessagesList = [];
      for (const field in validationErrors) {
        if (validationErrors.hasOwnProperty(field)) {
          // Handle potential JSON path notation like "$.text"
          const fieldName = field
            .replace("$.", "")
            .replace("['", "")
            .replace("']", "");
          errorMessagesList.push(
            `${fieldName}: ${validationErrors[field].join(", ")}`
          );
        }
      }
      errorMessage = errorMessagesList.join(" | ");
    } else if (err.response.data.message) {
      errorMessage = err.response.data.message;
    } else if (err.response.data.detail) {
      // For ProblemDetails
      errorMessage = err.response.data.detail;
    } else if (typeof err.response.data === "string") {
      errorMessage = err.response.data;
    } else if (err.response.statusText) {
      errorMessage = `${err.response.status}: ${err.response.statusText}`;
    }
  } else if (err.message) {
    errorMessage = err.message;
  }
  return errorMessage;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // These states below (urgencyLevels, users) are for caching fetched dropdown values.
  const [urgencyLevelsCache, setUrgencyLevelsCache] = useState([]);
  const [assignableUsersCache, setAssignableUsersCache] = useState([]);

  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "https://localhost:7035/api";

  const authAxios = useMemo(
    () =>
      axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` },
      }),
    [token, API_URL] // API_URL is from import.meta.env, typically stable after build
  );

  const clearError = useCallback(() => setError(null), []);

  // --- GET ALL TASKS (for Admin) ---
  const getAllTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAxios.get("/tasks");
      setTasks(response.data); // Optionally update a shared tasks state
      return response.data;
    } catch (err) {
      const errorMessage = extractErrorMessage(err, "Error fetching all tasks");
      console.error("Error fetching all tasks:", err.response || err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  // --- GET MY TASKS (for User) ---
  const getMyTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAxios.get("/tasks/my-tasks");
      setTasks(response.data); // Optionally update a shared tasks state
      return response.data;
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Error fetching your tasks"
      );
      console.error("Error fetching your tasks:", err.response || err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  // --- GET TASK BY ID ---
  const getTaskById = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        // Include comments in the GET request if your backend supports it
        // e.g., /tasks/{id}?includeComments=true or a separate endpoint
        // For simplicity, assuming the main task endpoint returns comments
        const response = await authAxios.get(`/tasks/${id}`);
        return response.data; // Does not set shared tasks state, returns single task
      } catch (err) {
        const errorMessage = extractErrorMessage(
          err,
          `Error fetching task #${id}`
        );
        console.error(`Error fetching task #${id}:`, err.response || err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authAxios]
  );

  // --- CREATE TASK ---
  const createTask = useCallback(
    async (taskData) => {
      setLoading(true);
      setError(null);

      const urgencyValue = urgencyStringToIntMap[taskData.urgency];
      if (urgencyValue === undefined) {
        const errorMsg = `Invalid urgency level: ${taskData.urgency}.`;
        setError(errorMsg);
        setLoading(false);
        throw new Error(errorMsg);
      }

      // Assuming TaskCreateDto on backend expects these fields and types
      // Status is typically set by the backend on creation (e.g., to "Assigned")
      const payload = {
        title: taskData.title,
        description: taskData.description,
        urgency: urgencyValue,
        dueDate: taskData.dueDate, // Ensure format is ISO string if backend expects string
        assignedToUserId: taskData.assignedToUserId,
      };

      try {
        const response = await authAxios.post("/tasks", payload);
        // Optionally: Invalidate cache or update local 'tasks' state
        // For example, if you maintain a list of all tasks:
        // getAllTasks(); // or setTasks(prev => [...prev, response.data]);
        return response.data;
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Error creating task");
        console.error("Error creating task:", err.response || err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authAxios]
  );

  // --- UPDATE TASK (Full update by Admin) ---
  const updateTask = useCallback(
    async (id, taskData) => {
      // taskData comes from EditTask.js's formData
      setLoading(true);
      setError(null);

      const urgencyValue = urgencyStringToIntMap[taskData.urgency];
      if (urgencyValue === undefined) {
        const errorMsg = `Invalid urgency level for update: ${taskData.urgency}.`;
        setError(errorMsg);
        setLoading(false);
        throw new Error(errorMsg);
      }

      const statusValue = taskStatusStringToIntMap[taskData.status];
      if (statusValue === undefined) {
        const errorMsg = `Invalid status for update: ${taskData.status}.`;
        setError(errorMsg);
        setLoading(false);
        throw new Error(errorMsg);
      }

      // Assuming TaskUpdateDto on backend expects these fields and types
      const payload = {
        title: taskData.title,
        description: taskData.description,
        urgency: urgencyValue,
        dueDate: taskData.dueDate, // Ensure format is ISO string
        assignedToUserId: taskData.assignedToUserId,
        status: statusValue, // Mapped integer value for the enum
      };

      try {
        // This PUT request should map to your backend's TaskUpdateDto
        const response = await authAxios.put(`/tasks/${id}`, payload);
        // Optionally: Invalidate cache or update local 'tasks' state
        return response.data;
      } catch (err) {
        const errorMessage = extractErrorMessage(
          err,
          `Error updating task #${id}`
        );
        console.error(`Error updating task #${id}:`, err.response || err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authAxios]
  );

  // --- DELETE TASK ---
  const deleteTask = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await authAxios.delete(`/tasks/${id}`);
        // Optionally: Invalidate cache or update local 'tasks' state
        // e.g., setTasks(prev => prev.filter(task => task.id !== id));
        return true;
      } catch (err) {
        const errorMessage = extractErrorMessage(
          err,
          `Error deleting task #${id}`
        );
        console.error(`Error deleting task #${id}:`, err.response || err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authAxios]
  );

  // --- UPDATE TASK STATUS (Partial update, typically by User for their own tasks, or Admin) ---
  const updateTaskStatus = useCallback(
    async (id, statusString) => {
      // statusString is e.g., "Completed"
      setLoading(true);
      setError(null);

      const statusValue = taskStatusStringToIntMap[statusString];
      if (statusValue === undefined) {
        const errorMsg = `Invalid task status: ${statusString}.`;
        setError(errorMsg);
        setLoading(false);
        throw new Error(errorMsg);
      }

      // Payload for PATCH /api/tasks/{id}/status
      // Backend TaskStatusUpdateDto expects: public TaskCompletionStatus Status { get; set; }
      const payload = { status: statusValue };

      try {
        await authAxios.patch(`/tasks/${id}/status`, payload);
        // Optionally: Invalidate cache or update specific task in local 'tasks' state
        return true;
      } catch (err) {
        const errorMessage = extractErrorMessage(
          err,
          `Error updating task status for #${id}`
        );
        console.error(
          `Error updating task status for #${id}:`,
          err.response || err
        );
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authAxios]
  );

  // --- ADD COMMENT TO TASK ---
  const addComment = useCallback(
    async (taskId, text) => {
      // setLoading(true); // Use component's specific loading for comments
      setError(null); // Clear context error for this operation
      try {
        // Assuming backend endpoint is POST /api/tasks/{taskId}/comments
        // and it expects a body like { text: "Your comment here" }
        const payload = { text: text };
        const response = await authAxios.post(
          `/tasks/${taskId}/comments`,
          payload
        );

        // Backend should return the newly created comment object
        // This object should ideally include: { id, text, authorUserName, createdAt, ... }
        const newComment = response.data;

        // No need to update global tasks state here, the component (UserTasks)
        // updates its local state with the returned newComment object.

        // setLoading(false); // Use component's specific loading
        return newComment; // Return the added comment object
      } catch (err) {
        const errorMessage = extractErrorMessage(
          err,
          `Error adding comment to task #${taskId}`
        );
        console.error(
          `Error adding comment to task #${taskId}:`,
          err.response || err
        );
        setError(errorMessage); // Set context error
        // setLoading(false); // Use component's specific loading
        throw new Error(errorMessage); // Re-throw error with extracted message for component to catch
      }
      // finally is not strictly needed here if loading is handled by component
    },
    [authAxios]
  ); // Depends on authAxios

  // --- GET URGENCY LEVELS (for dropdowns) ---
  const getUrgencyLevels = useCallback(async () => {
    // Basic caching to avoid re-fetching if already available
    if (urgencyLevelsCache.length > 0) {
      return urgencyLevelsCache;
    }
    setLoading(true); // Consider if dropdown fetches should set global loading
    setError(null);
    try {
      const response = await authAxios.get("/tasks/urgency-levels");
      setUrgencyLevelsCache(response.data); // Cache the levels
      return response.data; // Should be an array of strings: ["Low", "Medium", "High"]
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Error fetching urgency levels"
      );
      console.error("Error fetching urgency levels:", err.response || err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false); // Consider if dropdown fetches should set global loading
    }
  }, [authAxios, urgencyLevelsCache]); // urgencyLevelsCache added to deps

  // --- GET ASSIGNABLE USERS (for dropdowns) ---
  const getAssignableUsers = useCallback(async () => {
    // Basic caching
    if (assignableUsersCache.length > 0) {
      return assignableUsersCache;
    }
    setLoading(true); // Consider if dropdown fetches should set global loading
    setError(null);
    try {
      const response = await authAxios.get("/tasks/users"); // Endpoint for assignable users
      setAssignableUsersCache(response.data); // Cache the users
      return response.data; // Array of { id, userName, email }
    } catch (err) {
      const errorMessage = extractErrorMessage(
        err,
        "Error fetching assignable users"
      );
      console.error("Error fetching assignable users:", err.response || err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false); // Consider if dropdown fetches should set global loading
    }
  }, [authAxios, assignableUsersCache]); // assignableUsersCache added to deps

  // --- GET STATUS LEVELS (for dropdowns) ---
  const getStatusLevels = useCallback(async () => {
    // This function provides the keys from the predefined map.
    // For a truly dynamic approach, you'd fetch from a backend endpoint:
    // e.g., const response = await authAxios.get("/tasks/statuses"); return response.data;
    // The response should be an array of strings like ["Assigned", "InProgress", "Completed", "Blocked"]
    return Promise.resolve(Object.keys(taskStatusStringToIntMap));
  }, []); // No dependencies as it uses a constant map

  const contextValue = useMemo(
    () => ({
      tasks, // Current list of tasks (can be all or user-specific based on last fetch)
      loading,
      error,
      urgencyLevels: urgencyLevelsCache, // Provide cached levels
      assignableUsers: assignableUsersCache, // Provide cached users
      getAllTasks,
      getMyTasks,
      getTaskById,
      createTask,
      updateTask,
      deleteTask,
      updateTaskStatus,
      addComment, // <--- ADDED THIS LINE
      getUrgencyLevels,
      getAssignableUsers,
      getStatusLevels, // Provide this function
      clearError,
    }),
    [
      tasks,
      loading,
      error,
      urgencyLevelsCache,
      assignableUsersCache,
      getAllTasks,
      getMyTasks,
      getTaskById,
      createTask,
      updateTask,
      deleteTask,
      updateTaskStatus,
      addComment, // <--- ADDED THIS LINE to dependencies
      getUrgencyLevels,
      getAssignableUsers,
      getStatusLevels,
      clearError,
    ]
  );

  return (
    <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
  );
};
