package com.estudos.api.repository;

import com.estudos.api.domain.Topico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TopicoRepository extends JpaRepository<Topico, Long> {
    Optional<Topico> findByNomeIgnoreCase(String nome);
}
