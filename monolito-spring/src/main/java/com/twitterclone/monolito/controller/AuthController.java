package com.twitterclone.monolito.controller;

import com.twitterclone.monolito.dto.JwtResponseDTO;
import com.twitterclone.monolito.dto.LoginDTO;
import com.twitterclone.monolito.dto.UsuarioRegistroDTO;
import com.twitterclone.monolito.model.Usuario;
import com.twitterclone.monolito.security.JwtTokenProvider;
import com.twitterclone.monolito.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UsuarioService usuarioService;
    
    @Autowired
    private JwtTokenProvider tokenProvider;
    
    @PostMapping("/register")
    public ResponseEntity<?> registrarUsuario(@Valid @RequestBody UsuarioRegistroDTO registroDTO) {
        try {
            System.out.println("Registrando usuario: " + registroDTO.getUsername());
            Usuario usuario = usuarioService.registrarUsuario(registroDTO);
            System.out.println("Usuario registrado exitosamente: " + usuario.getUsername() + " con ID: " + usuario.getId());
            return ResponseEntity.ok().body("Usuario registrado exitosamente con id: " + usuario.getId());
        } catch (RuntimeException e) {
            System.out.println("Error en registro: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> autenticarUsuario(@Valid @RequestBody LoginDTO loginDTO) {
        try {
            System.out.println("Intento de login - Username: " + loginDTO.getUsername());
            
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginDTO.getUsername(),
                            loginDTO.getPassword()
                    )
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            
            Usuario usuario = usuarioService.obtenerUsuarioPorUsername(loginDTO.getUsername());
            
            System.out.println("Login exitoso para usuario: " + usuario.getUsername());
            
            return ResponseEntity.ok(new JwtResponseDTO(jwt, usuario.getId(), 
                    usuario.getUsername(), usuario.getEmail()));
        } catch (Exception e) {
            System.out.println("Error en login: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Credenciales inválidas: " + e.getMessage());
        }
    }
}
