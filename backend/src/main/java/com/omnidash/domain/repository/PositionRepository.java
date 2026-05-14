package com.omnidash.domain.repository;

import com.omnidash.domain.entity.PositionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PositionRepository extends JpaRepository<PositionEntity, UUID> {
    List<PositionEntity> findByPortfolioId(UUID portfolioId);
}
