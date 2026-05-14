package com.omnidash.controller;

import com.omnidash.domain.entity.PortfolioEntity;
import com.omnidash.dto.DashboardOutput;
import com.omnidash.exception.ApiException;
import com.omnidash.service.DashboardOrchestrator;
import com.omnidash.service.PortfolioService;
import com.omnidash.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardOrchestrator orchestrator;
    private final PortfolioService portfolioService;
    private final SessionService sessionService;

    @GetMapping("/portfolios")
    public ResponseEntity<List<Map<String, Object>>> listPortfolios(HttpServletRequest req) {
        UUID sessionId = sessionService.requireSessionId(req);
        List<PortfolioEntity> list = portfolioService.listForSession(sessionId);
        return ResponseEntity.ok(list.stream().map(p -> Map.<String, Object>of(
                "id", p.getId().toString(),
                "name", p.getName(),
                "source", p.getSource(),
                "createdAt", p.getCreatedAt().toString(),
                "baseCurrency", p.getBaseCurrency(),
                "riskProfile", p.getRiskProfile(),
                "audience", p.getAudience()
        )).toList());
    }

    @GetMapping("/dashboard/{portfolioId}")
    public ResponseEntity<DashboardOutput> getDashboard(
            @PathVariable UUID portfolioId,
            @RequestParam(value = "mode", required = false) String mode,
            HttpServletRequest req) {

        UUID sessionId = sessionService.requireSessionId(req);
        // Authorization: 본인 세션의 포트폴리오만 조회
        boolean owns = portfolioService.listForSession(sessionId).stream()
                .anyMatch(p -> p.getId().equals(portfolioId));
        if (!owns) throw ApiException.notFound("Portfolio not found in session.");

        DashboardOutput out = orchestrator.build(portfolioId, mode);
        return ResponseEntity.ok(out);
    }
}
