package com.estudos.api.dto;

public record TopicoResumoDTO(Long id, String nome, String cor,
                              double progresso, int totalItens, int concluidos) { }
