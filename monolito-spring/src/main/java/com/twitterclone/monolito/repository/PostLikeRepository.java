package com.twitterclone.monolito.repository;

import com.twitterclone.monolito.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByPostIdAndUsuarioId(Long postId, Long usuarioId);
    boolean existsByPostIdAndUsuarioId(Long postId, Long usuarioId);
    long countByPostId(Long postId);
    void deleteByPostIdAndUsuarioId(Long postId, Long usuarioId);
}
