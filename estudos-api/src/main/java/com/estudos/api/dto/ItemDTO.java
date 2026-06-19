package com.estudos.api.dto;

import com.estudos.api.domain.Item;

import java.time.LocalDate;

public record ItemDTO(Long id, String tipo, String titulo, String descricao,
                      String onde, String periodo, LocalDate dataPrevista,
                      String status, Integer peso) {

    public static ItemDTO from(Item i) {
        return new ItemDTO(i.getId(), i.getTipo().name(), i.getTitulo(), i.getDescricao(),
                i.getOnde(), i.getPeriodo(), i.getDataPrevista(), i.getStatus().name(), i.getPeso());
    }
}
