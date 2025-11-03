package com.twitterclone.monolito.repository;

import com.twitterclone.monolito.model.Stream;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StreamRepository extends JpaRepository<Stream, Long> {
    
    Optional<Stream> findByNombre(String nombre);
}
