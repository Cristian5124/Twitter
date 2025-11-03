package com.twitterclone.monolito.service;

import com.twitterclone.monolito.dto.ComentarioDTO;
import com.twitterclone.monolito.dto.PostDTO;
import com.twitterclone.monolito.model.Comentario;
import com.twitterclone.monolito.model.Post;
import com.twitterclone.monolito.model.PostLike;
import com.twitterclone.monolito.model.Usuario;
import com.twitterclone.monolito.repository.ComentarioRepository;
import com.twitterclone.monolito.repository.PostLikeRepository;
import com.twitterclone.monolito.repository.PostRepository;
import com.twitterclone.monolito.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PostService {
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private ComentarioRepository comentarioRepository;
    
    @Autowired
    private PostLikeRepository postLikeRepository;
    
    public Post crearPost(PostDTO postDTO, String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
        
        Post post = new Post();
        post.setContenido(postDTO.getContenido());
        post.setUsuario(usuario);
        
        return postRepository.save(post);
    }
    
    public List<Post> obtenerTodosPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public List<Post> obtenerPostsPorUsuario(Long usuarioId) {
        return postRepository.findByUsuarioIdOrderByCreatedAtDesc(usuarioId);
    }
    
    @Transactional
    public Map<String, Object> toggleLike(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post no encontrado"));
        
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
        
        Optional<PostLike> existingLike = postLikeRepository.findByPostIdAndUsuarioId(postId, usuario.getId());
        
        boolean liked;
        if (existingLike.isPresent()) {
            // Quitar like
            postLikeRepository.delete(existingLike.get());
            liked = false;
        } else {
            // Dar like
            PostLike newLike = new PostLike();
            newLike.setPost(post);
            newLike.setUsuario(usuario);
            postLikeRepository.save(newLike);
            liked = true;
        }
        
        long likesCount = postLikeRepository.countByPostId(postId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("liked", liked);
        response.put("likesCount", likesCount);
        
        return response;
    }
    
    public boolean usuarioLikePost(Long postId, String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
        
        return postLikeRepository.existsByPostIdAndUsuarioId(postId, usuario.getId());
    }
    
    public Comentario agregarComentario(Long postId, ComentarioDTO comentarioDTO, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post no encontrado"));
        
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
        
        Comentario comentario = new Comentario();
        comentario.setContenido(comentarioDTO.getContenido());
        comentario.setPost(post);
        comentario.setUsuario(usuario);
        
        return comentarioRepository.save(comentario);
    }
    
    public List<Comentario> obtenerComentarios(Long postId) {
        return comentarioRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }
    
    public Map<String, Object> obtenerEstadisticas(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post no encontrado"));
        
        Long cantidadComentarios = comentarioRepository.countByPostId(postId);
        Long cantidadLikes = postLikeRepository.countByPostId(postId);
        
        boolean usuarioLiked = false;
        if (username != null && !username.isEmpty()) {
            try {
                usuarioLiked = usuarioLikePost(postId, username);
            } catch (Exception e) {
                // Si el usuario no existe o hay error, simplemente no está liked
                usuarioLiked = false;
            }
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("likes", cantidadLikes);
        stats.put("comentarios", cantidadComentarios);
        stats.put("liked", usuarioLiked);
        
        return stats;
    }
}
