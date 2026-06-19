package com.estudos.api.dto;

import com.estudos.api.domain.Curso;

import java.math.BigDecimal;

public record CursoDTO(Long id, String nome, String descricao, String plataforma,
                       String periodo, String status, String pagamento, BigDecimal valor,
                       String moeda, Integer progresso, Integer mesesAtivos, String link) {

    public static CursoDTO from(Curso c) {
        return new CursoDTO(c.getId(), c.getNome(), c.getDescricao(), c.getPlataforma(),
                c.getPeriodo(), c.getStatus().name(), c.getPagamento().name(), c.getValor(),
                c.getMoeda(), c.getProgresso(), c.getMesesAtivos(), c.getLink());
    }
}
