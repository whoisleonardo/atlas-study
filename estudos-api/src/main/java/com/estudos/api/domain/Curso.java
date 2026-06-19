package com.estudos.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "curso")
@Getter @Setter @NoArgsConstructor
public class Curso {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topico_id")
    private Topico topico;

    @Column(nullable = false)
    private String nome;

    @Column(length = 1000)
    private String descricao;

    private String plataforma;
    private String periodo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CursoStatus status = CursoStatus.PLANEJADO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Pagamento pagamento = Pagamento.UNICO;

    @Column(precision = 12, scale = 2)
    private BigDecimal valor = BigDecimal.ZERO;

    private String moeda = "BRL";

    @Column(nullable = false)
    private Integer progresso = 0;

    @Column(nullable = false)
    private Integer mesesAtivos = 0;

    private String link;
}
