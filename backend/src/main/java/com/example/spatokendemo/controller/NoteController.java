package com.example.spatokendemo.controller;

import com.example.spatokendemo.model.Note;
import com.example.spatokendemo.model.NoteRequest;
import com.example.spatokendemo.repository.NoteRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteRepository noteRepository;

    public NoteController(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    @GetMapping
    public List<Note> listNotes(@AuthenticationPrincipal Jwt jwt) {
        return noteRepository.findByUsernameOrderByCreatedAtDesc(extractUsername(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Note createNote(@AuthenticationPrincipal Jwt jwt,
                           @Valid @RequestBody NoteRequest request) {
        Note note = new Note();
        note.setUsername(extractUsername(jwt));
        note.setTitle(request.title());
        note.setContent(request.content());
        return noteRepository.save(note);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNote(@AuthenticationPrincipal Jwt jwt,
                           @PathVariable UUID id) {
        Note note = noteRepository.findByIdAndUsername(id, extractUsername(jwt))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));
        noteRepository.delete(note);
    }

    private String extractUsername(Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        return username != null ? username : jwt.getSubject();
    }
}
