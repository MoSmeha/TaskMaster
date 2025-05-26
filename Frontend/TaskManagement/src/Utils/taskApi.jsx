// taskApi.js

// Keep the base URL as is, as requested
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7035"; // Vite env fallback

// Helper function to handle fetch requests
const fetchApi = async (url, options = {}) => {
  const token = localStorage.getItem("token"); // Or get token from AuthContext

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }), // Add Auth header if token exists
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json(); // Try to parse error response body
      } catch (e) {
        errorData = { message: response.statusText }; // Fallback error message
      }
      console.error("API Error:", response.status, errorData);
      const error = new Error(
        errorData?.message || `HTTP error! status: ${response.status}`
      );
      error.status = response.status;
      error.data = errorData; // Attach full error data if needed
      throw error;
    } // Handle responses with no content (like 204 No Content)

    if (response.status === 204) {
      return null;
    }

    return await response.json(); // Parse JSON response body for success cases
  } catch (error) {
    console.error("Fetch API call failed:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
};

// --- Task API Functions ---

// Admin: Get list of users (non-admins) for assignment
export const getAssignableUsers = () => {
  // Added /api to the path
  return fetchApi(`${API_BASE_URL}/api/tasks/users`);
};
// Add to taskApi.js
export const getUrgencyLevels = () => {
  return fetchApi(`${API_BASE_URL}/api/tasks/urgency-levels`);
};
// Admin: Create a new task
export const createTask = (taskData) => {
  const requestBody = {
    taskDto: {
      // Wrap in taskDto object
      Title: taskData.title,
      Description: taskData.description,
      Urgency: taskData.urgency,
      DueDate: taskData.dueDate,
      AssignedToUserId: taskData.assignedToUserId,
    },
  };

  return fetchApi(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
};
// Admin: Get all tasks
export const getAllTasks = () => {
  // Added /api to the path
  return fetchApi(`${API_BASE_URL}/api/tasks`);
};

// Admin: Update a task
export const updateTask = (taskId, taskData) => {
  const requestBody = {
    taskDto: {
      // Wrap in taskDto object
      Title: taskData.title,
      Description: taskData.description,
      Urgency: taskData.urgency,
      DueDate: taskData.dueDate,
      AssignedToUserId: taskData.assignedToUserId,
      Status: taskData.status,
    },
  };

  return fetchApi(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(requestBody),
  });
};
// Admin: Delete a task
export const deleteTask = (taskId) => {
  // Added /api to the path
  return fetchApi(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
  });
};

// User/Admin: Get tasks assigned to the current user
export const getMyTasks = () => {
  // Added /api to the path
  return fetchApi(`${API_BASE_URL}/api/tasks/my-tasks`);
};

// User/Admin: Update the status of a task
export const updateTaskStatus = (taskId, status) => {
  // Added /api to the path
  return fetchApi(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};
