
using System.Collections.Generic;
using System.Threading.Tasks;
using MySecureApi.Dtos;


namespace MySecureApi.Services 
{
    public interface INoteService
    {
  
        Task<IEnumerable<NoteDto>> GetAllNotesForUserAsync(string userId);

        Task<NoteDto?> GetNoteByIdForUserAsync(int noteId, string userId);

        Task<NoteDto> CreateNoteAsync(CreateNoteDto createNoteDto, string userId);

        Task<bool> UpdateNoteAsync(int noteId, UpdateNoteDto updateNoteDto, string userId);

        Task<bool> DeleteNoteAsync(int noteId, string userId);
    }
}