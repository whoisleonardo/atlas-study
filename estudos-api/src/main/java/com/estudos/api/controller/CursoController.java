package com.estudos.api.controller;

import com.estudos.api.dto.CursoDTO;
import com.estudos.api.dto.NovoCurso;
import com.estudos.api.service.CursoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cursos")
public class CursoController {

    private final CursoService service;

    public CursoController(CursoService service) {
        this.service = service;
    }

    @PutMapping("/{id}")
    public CursoDTO atualizar(@PathVariable Long id, @RequestBody NovoCurso dto) {
        return CursoDTO.from(service.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
