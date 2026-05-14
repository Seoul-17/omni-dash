package com.omnidash.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "positions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PositionEntity {
    @Id
    private UUID id;

    @Column(name = "portfolio_id", nullable = false)
    private UUID portfolioId;

    @Column(name = "asset_id", nullable = false)
    private String assetId;

    @Column(name = "asset_name")
    private String assetName;

    @Column(name = "asset_class", nullable = false)
    private String assetClass;

    private String sector;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "avg_cost", nullable = false)
    private BigDecimal avgCost;

    @Column(nullable = false)
    private BigDecimal weight;

    @Column(name = "base_currency")
    private String baseCurrency;

    @Column(name = "acquired_at")
    private LocalDate acquiredAt;
}
