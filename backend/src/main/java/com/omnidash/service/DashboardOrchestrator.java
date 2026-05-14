package com.omnidash.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.omnidash.domain.entity.DashboardCacheEntity;
import com.omnidash.domain.entity.PortfolioEntity;
import com.omnidash.domain.entity.PositionEntity;
import com.omnidash.domain.entity.TransactionEntity;
import com.omnidash.domain.repository.*;
import com.omnidash.dto.DashboardOutput;
import com.omnidash.dto.DashboardOutput.*;
import com.omnidash.exception.ApiException;
import com.omnidash.service.insight.InsightEngine;
import com.omnidash.service.metrics.MetricsEngine;
import com.omnidash.service.metrics.MetricsEngine.Computation;
import com.omnidash.service.skills.SkillsConfig;
import com.omnidash.service.viz.ChartBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 파이프라인 오케스트레이터 — Skills 00 §0.1 단계 [0]→[5] 실행.
 * 캐시(Skills 05 §6.3) 적용 + 출력 계약(§6.1) 직렬화.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardOrchestrator {

    private final PortfolioRepository portfolioRepo;
    private final PositionRepository positionRepo;
    private final TransactionRepository transactionRepo;
    private final DashboardCacheRepository cacheRepo;
    private final MetricsEngine metricsEngine;
    private final ChartBuilder chartBuilder;
    private final InsightEngine insightEngine;
    private final SkillsConfig skills;
    private final ObjectMapper objectMapper;

    @Transactional
    public DashboardOutput build(UUID portfolioId, String mode) {
        PortfolioEntity portfolio = portfolioRepo.findById(portfolioId)
                .orElseThrow(() -> ApiException.notFound("Portfolio not found: " + portfolioId));

        String effectiveMode = mode == null || mode.isBlank() ? "standard" : mode.toLowerCase(Locale.ROOT);

        // 캐시 키
        String cacheKey = computeCacheKey(portfolio, effectiveMode);
        Optional<DashboardCacheEntity> cached = cacheRepo.findById(cacheKey);
        if (cached.isPresent() && cached.get().getSkillVersion().equals(skills.version())) {
            try {
                DashboardOutput out = objectMapper.readValue(cached.get().getPayload(), DashboardOutput.class);
                log.info("Cache HIT: {}", cacheKey);
                return out;
            } catch (JsonProcessingException e) {
                log.warn("Cache deserialize failed, regenerating: {}", e.getMessage());
            }
        }

        // 데이터 로드
        List<PositionEntity> positions = positionRepo.findByPortfolioId(portfolioId);
        List<TransactionEntity> txs = transactionRepo.findByPortfolioIdOrderByExecutedAtAsc(portfolioId);

        if (positions.isEmpty()) {
            throw ApiException.badRequest("포트폴리오에 자산이 없습니다.");
        }

        // 메트릭 계산 (FX는 portfolio.baseCurrency 기준)
        String benchmarkId = skills.benchmark(portfolio.getBaseCurrency());
        Computation comp = metricsEngine.compute(positions, benchmarkId,
                portfolio.getRiskProfile(), portfolio.getBaseCurrency());

        // 변경된 weight를 DB에 영속화 (다음 조회 시 정확한 비중 노출)
        positionRepo.saveAll(positions);

        // 출력 빌드
        DashboardOutput output = assembleOutput(portfolio, positions, comp, txs, effectiveMode, cacheKey);

        // 캐시 저장
        try {
            cacheRepo.save(DashboardCacheEntity.builder()
                    .cacheKey(cacheKey)
                    .portfolioId(portfolioId)
                    .skillVersion(skills.version())
                    .payload(objectMapper.writeValueAsString(output))
                    .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                    .build());
        } catch (JsonProcessingException e) {
            log.warn("Cache write failed: {}", e.getMessage());
        }
        return output;
    }

    /** 임계값 등 Skills 설정 변경 시 호출 → 해당 portfolio의 모든 캐시 무효화. */
    @Transactional
    public void invalidateCacheFor(UUID portfolioId) {
        cacheRepo.deleteAll(cacheRepo.findAll().stream()
                .filter(c -> c.getPortfolioId().equals(portfolioId))
                .toList());
    }

    // ─────────────────── 출력 어셈블 ───────────────────

    private DashboardOutput assembleOutput(PortfolioEntity portfolio,
                                           List<PositionEntity> positions,
                                           Computation c,
                                           List<TransactionEntity> txs,
                                           String mode,
                                           String cacheKey) {
        DateTimeFormatter iso = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        // input_period 추정 (가장 이른 acquired_at ~ 오늘)
        String start = positions.stream()
                .map(PositionEntity::getAcquiredAt)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .map(Object::toString)
                .orElse(now.minusYears(1).toLocalDate().toString());
        String end = now.toLocalDate().toString();

        Meta meta = new Meta(
                now.format(iso),
                skills.version(),
                mode,
                portfolio.getAudience(),
                new Period(start, end),
                portfolio.getBaseCurrency(),
                portfolio.getRiskProfile(),
                portfolio.getLocale(),
                List.of(new PortfolioMeta(portfolio.getId().toString(), portfolio.getName(), portfolio.getSource())),
                cacheKey,
                null,
                null,
                splitWarnings(portfolio.getWarnings())
        );

        List<KPI> kpis = buildKpis(c, portfolio, mode);
        List<ChartSpec> charts = chartBuilder.build(c, mode, portfolio.getAudience());
        List<Insight> insights = insightEngine.generate(c, portfolio.getAudience(), mode);

        SemanticMetrics raw = new SemanticMetrics(
                new Returns(
                        roundD(c.getSimpleReturn(), 4),
                        roundD(c.getLogReturn(), 4),
                        roundD(c.getCumulativeReturn(), 4),
                        roundD(c.getCagr(), 4),
                        null, null
                ),
                new RiskMetrics(
                        roundD(c.getMdd(), 4),
                        c.getRecoveryDays() < 0 ? null : c.getRecoveryDays(),
                        roundD(c.getDownsideDeviation(), 4),
                        roundD(c.getSortino(), 4),
                        roundD(c.getVar95(), 4),
                        roundD(c.getCvar95(), 4),
                        roundD(c.getCalmar(), 4),
                        c.getAssetClassSeverity()
                ),
                new RiskAdjusted(
                        roundD(c.getSharpe(), 4),
                        roundD(c.getTreynor(), 4),
                        roundD(c.getInfoRatio(), 4),
                        roundD(c.getAlpha(), 4),
                        roundD(c.getBeta(), 4),
                        roundD(c.getRSquared(), 4)
                ),
                new BenchmarkRef(c.getBenchmarkId(), roundD(c.getBenchmarkCumulativeReturn(), 4)),
                c.getSampleSize()
        );

        Report report = "quick".equals(mode) ? null : buildReport(c, kpis, positions);

        return new DashboardOutput(meta, kpis, charts, report, insights, raw);
    }

    private List<KPI> buildKpis(Computation c, PortfolioEntity portfolio, String mode) {
        String period = portfolio.getCreatedAt().toLocalDate() + "~" + OffsetDateTime.now().toLocalDate();
        int n = c.getSampleSize() + 1;

        List<KPI> all = new ArrayList<>(List.of(
                new KPI("kpi_total_return", "총 수익률",
                        roundD(c.getCumulativeReturn() * 100, 2), "%", null,
                        c.getCumulativeReturn() >= 0 ? "positive" : "negative", null,
                        new Ref("cumulative_return", period, n)),
                new KPI("kpi_cagr", "연환산 수익률(CAGR)",
                        roundD(c.getCagr() * 100, 2), "%", null,
                        c.getCagr() >= 0 ? "positive" : "negative", null,
                        new Ref("cagr", period, n)),
                new KPI("kpi_sharpe", "샤프 비율",
                        roundD(c.getSharpe(), 2), "score", null,
                        c.getSharpe() >= 1.0 ? "positive" : "negative",
                        c.getSharpe() < 0.5 ? "warn" : null,
                        new Ref("sharpe", period, n)),
                new KPI("kpi_mdd", "MDD",
                        roundD(c.getMdd() * 100, 2), "%", null,
                        "negative",
                        c.getMdd() <= -0.20 ? "warn" : null,
                        new Ref("mdd", period, n)),
                new KPI("kpi_volatility", "연환산 변동성",
                        roundD(c.getSigma() * 100, 2), "%", null,
                        "neutral", null,
                        new Ref("sigma", period, n)),
                new KPI("kpi_cvar", "CVaR(95%)",
                        roundD(c.getCvar95() * 100, 2), "%", null,
                        "negative",
                        c.getCvar95() <= -0.03 ? "warn" : null,
                        new Ref("cvar_95", period, c.getSampleSize())),
                new KPI("kpi_calmar", "칼마 비율",
                        roundD(c.getCalmar(), 2), "score", null,
                        c.getCalmar() >= 0.5 ? "positive" : "negative",
                        c.getCalmar() < 0.3 ? "warn" : null,
                        new Ref("calmar", period, n))
        ));

        return switch (mode) {
            case "quick" -> all.stream().limit(1).toList();
            case "full" -> all;
            default -> all.subList(0, Math.min(5, all.size()));
        };
    }

    private Report buildReport(Computation c, List<KPI> kpis, List<PositionEntity> positions) {
        // BUILD 5단 (Skills 04 §4.1)
        String bluf = "총 수익률 %.1f%%, 샤프 %.2f, MDD %.1f%%. %s 자산군 가중 임계 기준으로 평가.".formatted(
                c.getCumulativeReturn() * 100,
                c.getSharpe(),
                c.getMdd() * 100,
                positions.size() == 1 ? positions.get(0).getAssetClass() : "복합");

        BenchmarkComparison bench = new BenchmarkComparison(
                c.getBenchmarkId(),
                roundD(c.getCumulativeReturn(), 4),
                roundD(c.getCumulativeReturn() - c.getBenchmarkCumulativeReturn(), 4),
                roundD(c.getTrackingError(), 4),
                List.of()
        );

        // contributors / detractors
        List<Attribution> contributors = new ArrayList<>();
        List<Attribution> detractors = new ArrayList<>();
        for (PositionEntity p : positions) {
            double[] prices = c.getPriceMap().get(p.getAssetId());
            double ret = prices[prices.length - 1] / prices[0] - 1.0;
            double w = p.getWeight().doubleValue();
            Attribution a = new Attribution(
                    p.getAssetId(),
                    p.getAssetName() != null ? p.getAssetName() : p.getAssetId(),
                    roundD(ret * w * 100, 2),
                    roundD(w, 4),
                    roundD(ret * 100, 2)
            );
            if (ret >= 0) contributors.add(a); else detractors.add(a);
        }
        contributors.sort(Comparator.comparingDouble(Attribution::contribution_pct).reversed());
        detractors.sort(Comparator.comparingDouble(Attribution::contribution_pct));

        // 시나리오
        List<Scenario> scenarios = List.of(
                new Scenario("optimistic", roundD(c.getCumulativeReturn() + 0.05, 4), roundD(c.getMdd() * 0.7, 4),
                        List.of("위험자산 비중 상향, 매크로 회복")),
                new Scenario("base", roundD(c.getCumulativeReturn(), 4), roundD(c.getMdd(), 4),
                        List.of("현 포트폴리오 유지")),
                new Scenario("pessimistic", roundD(c.getCumulativeReturn() - 0.10, 4), roundD(c.getMdd() * 1.3, 4),
                        List.of("외부 충격, 변동성 확대"))
        );

        // 액션
        List<ActionItem> actions = new ArrayList<>();
        for (PositionEntity p : positions) {
            Map<String, Object> t = skills.assetClass(p.getAssetClass());
            Object cw = t.get("concentration_warn");
            double warn = cw instanceof Number num ? num.doubleValue() : 0.30;
            double w = p.getWeight().doubleValue();
            if (w > warn) {
                actions.add(new ActionItem(
                        "trim",
                        p.getAssetId(),
                        roundD(warn, 4),
                        OffsetDateTime.now().plusMonths(1).toLocalDate().toString(),
                        "→ 02_metrics_skills.md §2.4.1 %s 단일 자산 집중 임계 초과".formatted(p.getAssetClass())
                ));
            }
        }
        if (actions.isEmpty()) {
            actions.add(new ActionItem("hold", null, null, null, "현 비중이 자산군별 임계 내"));
        }

        return new Report(
                new ReportSection.Bluf(bluf, kpis),
                new ReportSection.UContext(
                        "벤치마크 %s 대비 상대 성과 평가".formatted(c.getBenchmarkId()),
                        bench),
                new ReportSection.Investigate(contributors, detractors, "chart_performance"),
                new ReportSection.Liability(
                        new RiskMetrics(
                                roundD(c.getMdd(), 4),
                                c.getRecoveryDays() < 0 ? null : c.getRecoveryDays(),
                                roundD(c.getDownsideDeviation(), 4),
                                roundD(c.getSortino(), 4),
                                roundD(c.getVar95(), 4),
                                roundD(c.getCvar95(), 4),
                                roundD(c.getCalmar(), 4),
                                c.getAssetClassSeverity()
                        ),
                        scenarios),
                new ReportSection.Direction(
                        actions,
                        List.of("mdd", "concentration", "correlation_matrix", "recovery_days"))
        );
    }

    private List<String> splitWarnings(String s) {
        if (s == null || s.isBlank()) return List.of();
        return Arrays.stream(s.split("\\|\\|")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }

    private static double roundD(double v, int decimals) {
        if (Double.isNaN(v) || Double.isInfinite(v)) return 0;
        double scale = Math.pow(10, decimals);
        return Math.round(v * scale) / scale;
    }

    private String computeCacheKey(PortfolioEntity p, String mode) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String src = String.join("|",
                    p.getId().toString(),
                    skills.version(),
                    p.getAudience(),
                    mode,
                    p.getRiskProfile(),
                    p.getLocale(),
                    Long.toString(skills.lastLoadedMillis()));
            byte[] hash = md.digest(src.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return "sha256:" + sb.substring(0, 16);
        } catch (Exception e) {
            return "sha256:fallback-" + UUID.randomUUID();
        }
    }
}
