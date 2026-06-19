package com.estudos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NovoTopico(
        @NotBlank @Size(max = 120) String nome,
        @Size(max = 1000) String descricao,
        @Size(max = 20) String cor
) { }
