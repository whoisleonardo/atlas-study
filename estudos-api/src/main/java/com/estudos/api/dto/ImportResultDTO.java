package com.estudos.api.dto;

import java.util.List;

public record ImportResultDTO(int itensCriados, int cursosCriados, List<String> topicos) { }
