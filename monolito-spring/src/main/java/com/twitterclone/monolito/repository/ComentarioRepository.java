package com.twitterclone.monolito.repository;

import com.twitterclone.monolito.model.Comentario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComentarioRepository extends JpaRepository<Comentario, Long> {
    
    List<Comentario> findByPostIdOrderByCreatedAtDesc(Long postId);
    
    Long countByPostId(Long postId);
}
