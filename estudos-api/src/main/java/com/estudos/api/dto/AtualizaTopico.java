package com.estudos.api.dto;

import jakarta.validation.constraints.Size;

public record AtualizaTopico(
        @Size(max = 120) String nome,
        @Size(max = 1000) String descricao,
        @Size(max = 20) String cor
) { }
