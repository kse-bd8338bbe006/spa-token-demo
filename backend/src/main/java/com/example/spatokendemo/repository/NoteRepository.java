package com.example.spatokendemo.repository;

import com.example.spatokendemo.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, UUID> {
    List<Note> findByUsernameOrderByCreatedAtDesc(String username);
    Optional<Note> findByIdAndUsername(UUID id, String username);
}
