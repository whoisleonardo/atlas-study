package com.estudos.api.service;

import com.estudos.api.domain.Curso;
import com.estudos.api.domain.CursoStatus;
import com.estudos.api.domain.Pagamento;
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
        if (dto.nome() != null)        c.setNome(dto.nome());
        if (dto.descricao() != null)   c.setDescricao(dto.descricao());
        if (dto.plataforma() != null)  c.setPlataforma(dto.plataforma());
        if (dto.periodo() != null)     c.setPeriodo(dto.periodo());
        if (dto.link() != null)        c.setLink(dto.link());
        if (dto.pagamento() != null)   c.setPagamento(Parse.enumOr(Pagamento.class, dto.pagamento(), c.getPagamento()));
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
