package com.omnidash.domain.repository;

import com.omnidash.domain.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<TransactionEntity, UUID> {
    List<TransactionEntity> findByPortfolioIdOrderByExecutedAtAsc(UUID portfolioId);
}
