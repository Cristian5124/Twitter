package com.twitterclone.monolito.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    
    @NotBlank(message = "El contenido es obligatorio")
    @Size(max = 140, message = "El post no puede exceder 140 caracteres")
    private String contenido;
}
