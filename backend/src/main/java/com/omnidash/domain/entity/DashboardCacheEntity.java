package com.omnidash.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "dashboard_cache")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardCacheEntity {
    @Id
    @Column(name = "cache_key")
    private String cacheKey;

    @Column(name = "portfolio_id", nullable = false)
    private UUID portfolioId;

    @Column(name = "skill_version", nullable = false)
    private String skillVersion;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
