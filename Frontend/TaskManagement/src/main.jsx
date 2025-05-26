// src/main.jsx (or index.js)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Or your global CSS
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"; // Import the adapter

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Wrap App with LocalizationProvider */}
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <App />
    </LocalizationProvider>
  </React.StrictMode>
);
