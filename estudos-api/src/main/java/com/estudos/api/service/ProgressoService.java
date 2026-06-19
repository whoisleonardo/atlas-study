package com.estudos.api.service;

import com.estudos.api.domain.*;
import com.estudos.api.dto.ProgressoDTO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProgressoService {

    public ProgressoDTO calcular(Topico t) {
        List<Item> itens = t.getItens();

        int totalPeso = itens.stream().mapToInt(Item::getPeso).sum();
        int concluidoPeso = itens.stream()
                .filter(i -> i.getStatus() == Status.CONCLUIDO)
                .mapToInt(Item::getPeso).sum();
        double geral = totalPeso == 0 ? 0.0 : round(concluidoPeso * 100.0 / totalPeso);

        Map<String, Double> porPeriodo = new LinkedHashMap<>();
        Map<String, List<Item>> grupos = itens.stream()
                .filter(i -> i.getPeriodo() != null)
                .collect(Collectors.groupingBy(Item::getPeriodo, LinkedHashMap::new, Collectors.toList()));
        grupos.forEach((periodo, lista) -> {
            int tp = lista.stream().mapToInt(Item::getPeso).sum();
            int cp = lista.stream().filter(i -> i.getStatus() == Status.CONCLUIDO).mapToInt(Item::getPeso).sum();
            porPeriodo.put(periodo, tp == 0 ? 0.0 : round(cp * 100.0 / tp));
        });

        Map<String, BigDecimal> investido = new LinkedHashMap<>();
        Map<String, BigDecimal> mensalAtivo = new LinkedHashMap<>();
        for (Curso c : t.getCursos()) {
            BigDecimal valor = c.getValor() == null ? BigDecimal.ZERO : c.getValor();
            BigDecimal gasto = c.getPagamento() == Pagamento.ASSINATURA
                    ? valor.multiply(BigDecimal.valueOf(Math.max(c.getMesesAtivos(), 0)))
                    : valor;
            investido.merge(c.getMoeda(), gasto, BigDecimal::add);
            if (c.getPagamento() == Pagamento.ASSINATURA && c.getStatus() == CursoStatus.FAZENDO) {
                mensalAtivo.merge(c.getMoeda(), valor, BigDecimal::add);
            }
        }

        int concluidos = (int) itens.stream().filter(i -> i.getStatus() == Status.CONCLUIDO).count();
        return new ProgressoDTO(geral, itens.size(), concluidos, porPeriodo, investido, mensalAtivo);
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
