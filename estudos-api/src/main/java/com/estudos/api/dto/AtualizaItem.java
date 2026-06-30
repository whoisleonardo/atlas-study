package com.estudos.api.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AtualizaItem(
        @JsonAlias("data_prevista") LocalDate dataPrevista,
        @Size(max = 1000) String descricao
) { }
