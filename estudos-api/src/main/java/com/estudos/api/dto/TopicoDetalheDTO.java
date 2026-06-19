package com.estudos.api.dto;

import java.util.List;

public record TopicoDetalheDTO(Long id, String nome, String descricao,
                               ProgressoDTO progresso, List<ItemDTO> itens, List<CursoDTO> cursos) { }
