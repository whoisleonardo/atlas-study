package com.estudos.api.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record NovoItem(
        String tipo,
        @NotBlank @Size(max = 255) String titulo,
        @Size(max = 1000) String descricao,
        @Size(max = 255) String onde,
        @Size(max = 120) String periodo,
        @JsonAlias("data_prevista") LocalDate dataPrevista,
        String status,
        @Min(1) Integer peso
) { }
