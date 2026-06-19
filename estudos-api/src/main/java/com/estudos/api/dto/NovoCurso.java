package com.estudos.api.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record NovoCurso(
        @NotBlank @Size(max = 255) String nome,
        @Size(max = 1000) String descricao,
        @Size(max = 255) String plataforma,
        @Size(max = 120) String periodo,
        String status,
        String pagamento,
        @PositiveOrZero @Digits(integer = 10, fraction = 2) BigDecimal valor,
        @Size(max = 3) String moeda,
        @Min(0) @Max(100) Integer progresso,
        @PositiveOrZero @JsonAlias("meses_ativos") Integer mesesAtivos,
        String link
) { }
