package com.estudos.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "item")
@Getter @Setter @NoArgsConstructor
public class Item {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topico_id")
    private Topico topico;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemTipo tipo;

    @Column(nullable = false)
    private String titulo;

    @Column(length = 1000)
    private String descricao;

    private String onde;
    private String periodo;
    private LocalDate dataPrevista;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDENTE;

    @Column(nullable = false)
    private Integer peso = 1;
}
