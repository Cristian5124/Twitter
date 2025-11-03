package com.twitterclone.monolito.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComentarioDTO {
    
    @NotBlank(message = "El comentario no puede estar vacío")
    @Size(max = 280, message = "El comentario no puede exceder 280 caracteres")
    private String contenido;
}
