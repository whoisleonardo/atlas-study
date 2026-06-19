package com.estudos.api.service;

import com.estudos.api.domain.*;
import com.estudos.api.dto.*;
import com.estudos.api.exception.NotFoundException;
import com.estudos.api.repository.TopicoRepository;
import com.estudos.api.util.Parse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TopicoService {

    private final TopicoRepository repo;
    private final ProgressoService progresso;

    public TopicoService(TopicoRepository repo, ProgressoService progresso) {
        this.repo = repo;
        this.progresso = progresso;
    }

    @Transactional(readOnly = true)
    public List<TopicoResumoDTO> listar() {
        return repo.findAll().stream().map(t -> {
            ProgressoDTO p = progresso.calcular(t);
            return new TopicoResumoDTO(t.getId(), t.getNome(), t.getCor(),
                    p.percentualGeral(), p.totalItens(), p.concluidos());
        }).toList();
    }

    @Transactional(readOnly = true)
    public TopicoDetalheDTO detalhe(Long id) {
        Topico t = buscar(id);
        ProgressoDTO p = progresso.calcular(t);
        return new TopicoDetalheDTO(t.getId(), t.getNome(), t.getDescricao(), p,
                t.getItens().stream().map(ItemDTO::from).toList(),
                t.getCursos().stream().map(CursoDTO::from).toList());
    }

    @Transactional
    public Topico criar(NovoTopico dto) {
        Topico t = new Topico();
        t.setNome(dto.nome());
        t.setDescricao(dto.descricao());
        t.setCor(dto.cor());
        return repo.save(t);
    }

    @Transactional
    public Item adicionarItem(Long topicoId, NovoItem dto) {
        Topico t = buscar(topicoId);
        Item i = new Item();
        i.setTipo(Parse.enumOr(ItemTipo.class, dto.tipo(), ItemTipo.PRATICA));
        i.setTitulo(dto.titulo());
        i.setDescricao(dto.descricao());
        i.setOnde(dto.onde());
        i.setPeriodo(dto.periodo());
        i.setDataPrevista(dto.dataPrevista());
        i.setStatus(Parse.enumOr(Status.class, dto.status(), Status.PENDENTE));
        i.setPeso(dto.peso() == null ? 1 : dto.peso());
        t.addItem(i);
        repo.save(t);
        return i;
    }

    @Transactional
    public Curso adicionarCurso(Long topicoId, NovoCurso dto) {
        Topico t = buscar(topicoId);
        Curso c = new Curso();
        c.setNome(dto.nome());
        c.setDescricao(dto.descricao());
        c.setPlataforma(dto.plataforma());
        c.setPeriodo(dto.periodo());
        c.setStatus(Parse.enumOr(CursoStatus.class, dto.status(), CursoStatus.PLANEJADO));
        c.setPagamento(Parse.enumOr(Pagamento.class, dto.pagamento(), Pagamento.UNICO));
        c.setValor(dto.valor() == null ? BigDecimal.ZERO : dto.valor());
        c.setMoeda(dto.moeda() == null ? "BRL" : dto.moeda().toUpperCase());
        c.setProgresso(dto.progresso() == null ? 0 : dto.progresso());
        c.setMesesAtivos(dto.mesesAtivos() == null ? 0 : dto.mesesAtivos());
        c.setLink(dto.link());
        t.addCurso(c);
        repo.save(t);
        return c;
    }

    @Transactional
    public Topico atualizar(Long id, AtualizaTopico dto) {
        Topico t = buscar(id);
        if (dto.nome() != null && !dto.nome().isBlank()) t.setNome(dto.nome());
        if (dto.descricao() != null) t.setDescricao(dto.descricao());
        if (dto.cor() != null) t.setCor(dto.cor());
        return repo.save(t);
    }

    @Transactional
    public void remover(Long id) {
        repo.deleteById(id);
    }

    private Topico buscar(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Tópico " + id + " não encontrado"));
    }
}
