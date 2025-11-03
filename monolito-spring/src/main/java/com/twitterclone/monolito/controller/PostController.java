package com.twitterclone.monolito.controller;

import com.twitterclone.monolito.dto.ComentarioDTO;
import com.twitterclone.monolito.dto.PostDTO;
import com.twitterclone.monolito.model.Comentario;
import com.twitterclone.monolito.model.Post;
import com.twitterclone.monolito.service.PostService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostController {
    
    @Autowired
    private PostService postService;
    
    @PostMapping
    public ResponseEntity<?> crearPost(@Valid @RequestBody PostDTO postDTO) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            Post post = postService.crearPost(postDTO, username);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping
    public ResponseEntity<List<Post>> obtenerTodosPosts() {
        List<Post> posts = postService.obtenerTodosPosts();
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Post>> obtenerPostsPorUsuario(@PathVariable Long usuarioId) {
        List<Post> posts = postService.obtenerPostsPorUsuario(usuarioId);
        return ResponseEntity.ok(posts);
    }
    
    @PutMapping("/{postId}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long postId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            Map<String, Object> response = postService.toggleLike(postId, username);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/{postId}/comentarios")
    public ResponseEntity<?> agregarComentario(
            @PathVariable Long postId,
            @Valid @RequestBody ComentarioDTO comentarioDTO) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            Comentario comentario = postService.agregarComentario(postId, comentarioDTO, username);
            return ResponseEntity.ok(comentario);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/{postId}/comentarios")
    public ResponseEntity<?> obtenerComentarios(@PathVariable Long postId) {
        try {
            List<Comentario> comentarios = postService.obtenerComentarios(postId);
            return ResponseEntity.ok(comentarios);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/{postId}/stats")
    public ResponseEntity<?> obtenerEstadisticasPost(@PathVariable Long postId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = null;
            
            // Verificar si el usuario está autenticado
            if (authentication != null && authentication.isAuthenticated() 
                    && !authentication.getName().equals("anonymousUser")) {
                username = authentication.getName();
            }
            
            Map<String, Object> stats = postService.obtenerEstadisticas(postId, username);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
