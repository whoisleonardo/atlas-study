package com.estudos.api.service;

import com.estudos.api.domain.Curso;
import com.estudos.api.domain.CursoStatus;
import com.estudos.api.dto.NovoCurso;
import com.estudos.api.exception.NotFoundException;
import com.estudos.api.repository.CursoRepository;
import com.estudos.api.util.Parse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class CursoService {

    private final CursoRepository repo;

    public CursoService(CursoRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public Curso atualizar(Long id, NovoCurso dto) {
        Curso c = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Curso " + id + " não encontrado"));
        if (dto.status() != null)      c.setStatus(Parse.enumOr(CursoStatus.class, dto.status(), c.getStatus()));
        if (dto.progresso() != null)   c.setProgresso(Math.min(100, Math.max(0, dto.progresso())));
        if (dto.mesesAtivos() != null) c.setMesesAtivos(Math.max(0, dto.mesesAtivos()));
        if (dto.valor() != null)       c.setValor(dto.valor().max(BigDecimal.ZERO));
        if (dto.moeda() != null)       c.setMoeda(dto.moeda().toUpperCase());
        return repo.save(c);
    }

    @Transactional
    public void remover(Long id) {
        repo.deleteById(id);
    }
}
