
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySecureApi.Dtos;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using MySecureApi.Services;

namespace MySecureApi.Controllers 
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "User")] 
    public class NotesController : ControllerBase
    {
        private readonly INoteService _noteService;

        public NotesController(INoteService noteService) 
        {
            _noteService = noteService ?? throw new ArgumentNullException(nameof(noteService));
        }

        private string GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new InvalidOperationException("User ID claim (NameIdentifier) not found in token.");
            }
            return userId;
        }

        // GET: api/notes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NoteDto>>> GetNotes()
        {
            var userId = GetCurrentUserId();
            var notes = await _noteService.GetAllNotesForUserAsync(userId);
            return Ok(notes);
        }

        // GET: api/notes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<NoteDto>> GetNote(int id)
        {
            var userId = GetCurrentUserId();
            var note = await _noteService.GetNoteByIdForUserAsync(id, userId);

            if (note == null)
            {
                return NotFound(new { Message = $"Note with ID {id} not found or you do not have permission." });
            }

            return Ok(note);
        }

        // POST: api/notes
        [HttpPost]
        public async Task<ActionResult<NoteDto>> CreateNote([FromBody] CreateNoteDto createNoteDto)
        {

            var userId = GetCurrentUserId();
            var createdNote = await _noteService.CreateNoteAsync(createNoteDto, userId);

            return CreatedAtAction(nameof(GetNote), new { id = createdNote.Id }, createdNote);
        }

        // PUT: api/notes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNote(int id, [FromBody] UpdateNoteDto updateNoteDto)
        {

            var userId = GetCurrentUserId();
            var success = await _noteService.UpdateNoteAsync(id, updateNoteDto, userId);

            if (!success)
            {
                return NotFound(new { Message = $"Note with ID {id} not found or you do not have permission to update it." });
            }

            return NoContent();
        }

        // DELETE: api/notes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNote(int id)
        {
            var userId = GetCurrentUserId();
            var success = await _noteService.DeleteNoteAsync(id, userId);

            if (!success)
            {
                return NotFound(new { Message = $"Note with ID {id} not found or you do not have permission to delete it." });
            }

            return NoContent();
        }
    }
}