package com.estudos.api.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.time.LocalDate;

public record AtualizaItem(
        @JsonAlias("data_prevista") LocalDate dataPrevista
) { }
