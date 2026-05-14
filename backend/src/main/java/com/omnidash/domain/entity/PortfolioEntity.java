package com.omnidash.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "portfolios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioEntity {
    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String source;

    @Column(name = "base_currency", nullable = false)
    private String baseCurrency;

    @Column(name = "risk_profile", nullable = false)
    private String riskProfile;

    @Column(nullable = false)
    private String audience;

    @Column(nullable = false)
    private String locale;

    @Column(name = "raw_filename")
    private String rawFilename;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "warnings")
    private String warnings;
}
