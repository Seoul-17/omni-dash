package com.omnidash.domain.repository;

import com.omnidash.domain.entity.DashboardCacheEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DashboardCacheRepository extends JpaRepository<DashboardCacheEntity, String> {
}
