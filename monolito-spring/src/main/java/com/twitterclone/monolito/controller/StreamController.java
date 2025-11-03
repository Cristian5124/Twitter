package com.twitterclone.monolito.controller;

import com.twitterclone.monolito.model.Post;
import com.twitterclone.monolito.model.Stream;
import com.twitterclone.monolito.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "*")
public class StreamController {
    
    @Autowired
    private PostService postService;
    
    @GetMapping
    public ResponseEntity<?> obtenerStream() {
        try {
            List<Post> posts = postService.obtenerTodosPosts();
            
            Stream stream = new Stream();
            stream.setId(1L);
            stream.setNombre("Stream Global");
            stream.setDescripcion("Stream unificado con todos los posts");
            stream.setPosts(posts);
            
            return ResponseEntity.ok(stream);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/posts")
    public ResponseEntity<List<Post>> obtenerPostsStream() {
        List<Post> posts = postService.obtenerTodosPosts();
        return ResponseEntity.ok(posts);
    }
}
