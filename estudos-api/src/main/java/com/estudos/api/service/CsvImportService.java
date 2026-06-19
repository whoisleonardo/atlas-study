package com.estudos.api.service;

import com.estudos.api.domain.*;
import com.estudos.api.dto.ImportResultDTO;
import com.estudos.api.repository.TopicoRepository;
import com.estudos.api.util.Parse;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CsvImportService {

    private final TopicoRepository topicoRepo;

    public CsvImportService(TopicoRepository topicoRepo) {
        this.topicoRepo = topicoRepo;
    }

    @Transactional
    public ImportResultDTO importar(InputStream in) throws Exception {
        Map<String, Topico> cache = new LinkedHashMap<>();
        int itens = 0, cursos = 0;

        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreSurroundingSpaces(true)
                .setTrim(true)
                .build();

        try (Reader reader = new InputStreamReader(in, StandardCharsets.UTF_8);
             CSVParser parser = new CSVParser(reader, format)) {

            for (CSVRecord r : parser) {
                String nomeTopico = get(r, "topico");
                if (nomeTopico == null) continue;

                Topico topico = cache.computeIfAbsent(nomeTopico.toLowerCase(), k ->
                        topicoRepo.findByNomeIgnoreCase(nomeTopico)
                                .orElseGet(() -> {
                                    Topico t = new Topico();
                                    t.setNome(nomeTopico);
                                    return t;
                                }));

                String tipo = get(r, "tipo");
                if (tipo != null && tipo.equalsIgnoreCase("curso")) {
                    topico.addCurso(toCurso(r));
                    cursos++;
                } else {
                    topico.addItem(toItem(r, tipo));
                    itens++;
                }
            }
        }

        topicoRepo.saveAll(cache.values());
        List<String> nomes = new ArrayList<>(cache.values().stream().map(Topico::getNome).toList());
        return new ImportResultDTO(itens, cursos, nomes);
    }

    private Item toItem(CSVRecord r, String tipo) {
        Item i = new Item();
        i.setTipo(Parse.enumOr(ItemTipo.class, tipo, ItemTipo.PRATICA));
        i.setTitulo(orEmpty(get(r, "titulo")));
        i.setDescricao(get(r, "descricao"));
        i.setOnde(get(r, "onde"));
        i.setPeriodo(get(r, "periodo"));
        i.setDataPrevista(Parse.date(get(r, "data_prevista")));
        i.setStatus(Parse.enumOr(Status.class, get(r, "status"), Status.PENDENTE));
        i.setPeso(Parse.intOr(get(r, "peso"), 1));
        return i;
    }

    private Curso toCurso(CSVRecord r) {
        Curso c = new Curso();
        c.setNome(orEmpty(get(r, "titulo")));
        c.setDescricao(get(r, "descricao"));
        c.setPlataforma(get(r, "onde"));
        c.setPeriodo(get(r, "periodo"));
        c.setStatus(Parse.enumOr(CursoStatus.class, get(r, "status"), CursoStatus.PLANEJADO));
        c.setPagamento(Parse.enumOr(Pagamento.class, get(r, "pagamento"), Pagamento.UNICO));
        c.setValor(Parse.big(get(r, "valor")));
        String moeda = get(r, "moeda");
        c.setMoeda(moeda == null ? "BRL" : moeda.toUpperCase());
        c.setProgresso(Parse.intOr(get(r, "progresso"), 0));
        c.setLink(get(r, "link"));
        return c;
    }

    private static String get(CSVRecord r, String col) {
        if (!r.isMapped(col)) return null;
        String v = r.get(col);
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    private static String orEmpty(String s) {
        return s == null ? "" : s;
    }
}
