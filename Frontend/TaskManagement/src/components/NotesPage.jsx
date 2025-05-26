// src/Pages/NotesPage.js
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Snackbar, // For feedback messages
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useApi } from "../Utils/api"; // Import YOUR useApi hook path
import NoteForm from "./NoteForm"; // Import the NoteForm component

const NotesPage = () => {
  // Destructure the specific note API functions from YOUR useApi hook
  const { getNotes, createNote, updateNote, deleteNote } = useApi();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null); // State to hold note being edited
  const [isSubmitting, setIsSubmitting] = useState(false); // State for form submission loading
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const fetchNotes = async () => {
    setError(""); // Clear errors before fetching
    setLoading(true);
    try {
      // Call the getNotes function from your useApi hook
      const data = await getNotes();
      // Sort notes by creation date, latest first
      setNotes(
        data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
      );
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      // Your useApi hook handles 401/403 redirection.
      // We only display other errors here.
      if (err.statusCode !== 401 && err.statusCode !== 403) {
        setError(err.message || "Failed to load notes.");
      }
      // Note: If the error is 401/403, the useApi hook should redirect,
      // so setting a local error might be redundant in those cases,
      // but it's harmless.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(); // Fetch notes when component mounts
    // fetchNotes has no external dependencies, safe to run once.
    // If getNotes *itself* somehow depended on state/props that change,
    // you'd need to include them here, but that's unlikely for a fetch-all.
  }, []);

  const handleCreateNote = () => {
    setEditingNote(null); // Ensure we are creating, not editing
    setIsFormOpen(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        // Call the deleteNote function from your useApi hook
        await deleteNote(id);
        setNotes(notes.filter((note) => note.id !== id));
        showSnackbar("Note deleted successfully!", "success");
      } catch (err) {
        console.error("Failed to delete note:", err);
        // Your useApi hook handles 401/403 redirection.
        // Display other errors.
        if (err.statusCode !== 401 && err.statusCode !== 403) {
          showSnackbar(err.message || "Failed to delete note.", "error");
        }
      }
    }
  };

  const handleFormSubmit = async (noteData) => {
    setIsSubmitting(true);
    setError(""); // Clear previous errors from the form dialog
    try {
      if (editingNote) {
        // Update existing note using updateNote from your useApi hook
        await updateNote(editingNote.id, noteData);
        showSnackbar("Note updated successfully!", "success");
      } else {
        // Create new note using createNote from your useApi hook
        // Assuming createNote returns the newly created note object
        await createNote(noteData);
        showSnackbar("Note created successfully!", "success");
      }
      setIsFormOpen(false); // Close the form
      setEditingNote(null); // Reset editing state
      fetchNotes(); // Re-fetch notes to update the list with the new/updated note
    } catch (err) {
      console.error("Failed to save note:", err);
      // Your useApi hook handles 401/403 redirection.
      // Display other errors, preferably within the form dialog.
      if (err.statusCode !== 401 && err.statusCode !== 403) {
        setError(err.message || "Failed to save note."); // Set error to display in the dialog
        showSnackbar(err.message || "Failed to save note.", "error"); // Also show snackbar
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingNote(null); // Reset editing state when closing form
    setError(""); // Clear form errors when closing
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Your Notes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNote}
          disabled={loading} // Prevent adding while loading initial notes
        >
          Add Note
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error && !isFormOpen ? ( // Only show global error if form is closed
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {notes.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" align="center">
                You don't have any notes yet. Click "Add Note" to create one!
              </Typography>
            </Grid>
          ) : (
            notes.map((note) => (
              <Grid item xs={12} sm={6} md={4} key={note.id}>
                <Card
                  elevation={3}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {note.title}
                    </Typography>
                    {/* Only render description if it exists */}
                    {note.description && (
                      <Typography variant="body2" color="text.secondary">
                        {note.description}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      Created: {new Date(note.dateCreated).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "flex-end" }}>
                    <IconButton
                      aria-label="edit"
                      onClick={() => handleEditNote(note)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Note Creation/Edit Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={handleFormClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingNote ? "Edit Note" : "Create Note"}</DialogTitle>
        <DialogContent>
          {/* Display error within the form dialog if it exists */}
          {error && isFormOpen && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <NoteForm
            initialData={editingNote}
            onSubmit={handleFormSubmit}
            onClose={handleFormClose}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotesPage;
