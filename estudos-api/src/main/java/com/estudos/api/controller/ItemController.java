package com.estudos.api.controller;

import com.estudos.api.dto.AtualizaItem;
import com.estudos.api.dto.ItemDTO;
import com.estudos.api.dto.StatusUpdate;
import com.estudos.api.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/itens")
public class ItemController {

    private final ItemService service;

    public ItemController(ItemService service) {
        this.service = service;
    }

    @PatchMapping("/{id}/status")
    public ItemDTO atualizarStatus(@PathVariable Long id, @RequestBody StatusUpdate dto) {
        return ItemDTO.from(service.atualizarStatus(id, dto.status()));
    }

    @PatchMapping("/{id}")
    public ItemDTO atualizar(@PathVariable Long id, @Valid @RequestBody AtualizaItem dto) {
        return ItemDTO.from(service.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
