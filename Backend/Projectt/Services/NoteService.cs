using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MySecureApi.Data;
using MySecureApi.Dtos;
using MySecureApi.Models;

namespace MySecureApi.Services
{
    public class NoteService : INoteService
    {
        private readonly ApplicationDbContext _context;

        public NoteService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<NoteDto> CreateNoteAsync(CreateNoteDto createNoteDto, string userId)
        {
            var note = new Note
            {
                Title = createNoteDto.Title,
                Description = createNoteDto.Description,
                UserId = userId,
            };

            await _context.Notes.AddAsync(note);
            await _context.SaveChangesAsync();

            return MapToDto(note);
        }

        public async Task<bool> DeleteNoteAsync(int noteId, string userId)
        {
            var note = await _context.Notes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId);

            if (note == null) return false;

            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<NoteDto>> GetAllNotesForUserAsync(string userId)
        {
            var notes = await _context.Notes
                .Where(n => n.UserId == userId)
                .ToListAsync();

            return notes.Select(MapToDto);
        }

        public async Task<NoteDto?> GetNoteByIdForUserAsync(int noteId, string userId)
        {
            var note = await _context.Notes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId);

            if (note == null) return null;

            return MapToDto(note);
        }

        public async Task<bool> UpdateNoteAsync(int noteId, UpdateNoteDto updateNoteDto, string userId)
        {
            var note = await _context.Notes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId);

            if (note == null) return false;

            note.Title = updateNoteDto.Title;
            note.Description = updateNoteDto.Description;
            note.DateCreated = note.DateCreated; // leave original

            _context.Notes.Update(note);
            await _context.SaveChangesAsync();

            return true;
        }

        private NoteDto MapToDto(Note note) => new NoteDto
        {
            Id = note.Id,
            Title = note.Title,
            Description = note.Description,
            DateCreated = note.DateCreated
        };
    }
}
