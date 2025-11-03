package com.twitterclone.monolito.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*; 
import jakarta.validation.constraints.NotBlank; 
import jakarta.validation.constraints.Size; 
import lombok.AllArgsConstructor; 
import lombok.Data; 
import lombok.NoArgsConstructor; 
import org.springframework.data.annotation.CreatedDate; 
import org.springframework.data.jpa.domain.support.AuditingEntityListener; 
 
import java.time.LocalDateTime; 
 
@Entity 
@Table(name = "comentarios") 
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
@EntityListeners(AuditingEntityListener.class) 
public class Comentario { 
 
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id; 
 
    @NotBlank(message = "El comentario no puede estar vacio") 
    @Size(max = 280, message = "El comentario no puede exceder 280 caracteres") 
    @Column(nullable = false, length = 280) 
    private String contenido; 
 
    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "post_id", nullable = false) 
    @JsonIgnore
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "comentarios", "likes"})
    private Post post; 
 
    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "usuario_id", nullable = false) 
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "posts"}) 
    private Usuario usuario; 
 
    @CreatedDate 
    @Column(nullable = false, updatable = false) 
    private LocalDateTime createdAt; 
}
