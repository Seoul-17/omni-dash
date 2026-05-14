package com.omnidash.domain.repository;

import com.omnidash.domain.entity.PortfolioEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PortfolioRepository extends JpaRepository<PortfolioEntity, UUID> {
    List<PortfolioEntity> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);
}
