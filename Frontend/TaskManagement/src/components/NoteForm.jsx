// src/Components/NoteForm.js
import React, { useState, useEffect } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";

const NoteForm = ({ initialData = null, onSubmit, onClose, isSubmitting }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
    } else {
      setTitle("");
      setDescription("");
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    setTitleError(false);
    onSubmit({ title: title.trim(), description: description.trim() });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
    >
      <Typography variant="h6">
        {initialData ? "Edit Note" : "Create New Note"}
      </Typography>
      <TextField
        label="Title"
        variant="outlined"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        error={titleError}
        helperText={titleError && "Title is required"}
        disabled={isSubmitting}
      />
      <TextField
        label="Description"
        variant="outlined"
        fullWidth
        multiline
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isSubmitting}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button onClick={onClose} color="secondary" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? initialData
              ? "Saving..."
              : "Creating..."
            : initialData
            ? "Save Changes"
            : "Create Note"}
        </Button>
      </Box>
    </Box>
  );
};

export default NoteForm;
