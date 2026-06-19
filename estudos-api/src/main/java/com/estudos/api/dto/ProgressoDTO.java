package com.estudos.api.dto;

import java.math.BigDecimal;
import java.util.Map;

public record ProgressoDTO(double percentualGeral, int totalItens, int concluidos,
                           Map<String, Double> porPeriodo,
                           Map<String, BigDecimal> investidoPorMoeda,
                           Map<String, BigDecimal> mensalAtivoPorMoeda) { }
