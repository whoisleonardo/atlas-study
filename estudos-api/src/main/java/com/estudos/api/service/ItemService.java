package com.estudos.api.service;

import com.estudos.api.domain.Item;
import com.estudos.api.domain.Status;
import com.estudos.api.dto.AtualizaItem;
import com.estudos.api.exception.NotFoundException;
import com.estudos.api.repository.ItemRepository;
import com.estudos.api.util.Parse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ItemService {

    private final ItemRepository repo;

    public ItemService(ItemRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public Item atualizarStatus(Long id, String status) {
        Item i = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Item " + id + " não encontrado"));
        i.setStatus(Parse.enumOr(Status.class, status, i.getStatus()));
        return repo.save(i);
    }

    @Transactional
    public Item atualizar(Long id, AtualizaItem dto) {
        Item i = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Item " + id + " não encontrado"));
        if (dto.dataPrevista() != null) i.setDataPrevista(dto.dataPrevista());
        if (dto.descricao() != null) i.setDescricao(dto.descricao());
        return repo.save(i);
    }

    @Transactional
    public void remover(Long id) {
        repo.deleteById(id);
    }
}
