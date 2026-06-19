package com.estudos.api.controller;

import com.estudos.api.dto.*;
import com.estudos.api.service.TopicoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/topicos")
public class TopicoController {

    private final TopicoService service;

    public TopicoController(TopicoService service) {
        this.service = service;
    }

    @GetMapping
    public List<TopicoResumoDTO> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public TopicoDetalheDTO detalhe(@PathVariable Long id) {
        return service.detalhe(id);
    }

    @PostMapping
    public ResponseEntity<Long> criar(@Valid @RequestBody NovoTopico dto) {
        return ResponseEntity.status(201).body(service.criar(dto).getId());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Void> atualizar(@PathVariable Long id, @Valid @RequestBody AtualizaTopico dto) {
        service.atualizar(id, dto);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/itens")
    public ResponseEntity<ItemDTO> adicionarItem(@PathVariable Long id, @Valid @RequestBody NovoItem dto) {
        return ResponseEntity.status(201).body(ItemDTO.from(service.adicionarItem(id, dto)));
    }

    @PostMapping("/{id}/cursos")
    public ResponseEntity<CursoDTO> adicionarCurso(@PathVariable Long id, @Valid @RequestBody NovoCurso dto) {
        return ResponseEntity.status(201).body(CursoDTO.from(service.adicionarCurso(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
