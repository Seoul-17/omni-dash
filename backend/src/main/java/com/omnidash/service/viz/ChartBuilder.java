package com.omnidash.service.viz;

import com.omnidash.domain.entity.PositionEntity;
import com.omnidash.dto.DashboardOutput.*;
import com.omnidash.service.metrics.MetricsEngine.Computation;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Skills 03_visualization_skills.md 차트 선택 매트릭스 구현.
 * audience × 자산수 × 데이터 특성에 따라 차트 셋을 결정.
 */
@Service
public class ChartBuilder {

    public List<ChartSpec> build(Computation c, String mode, String audience) {
        if ("quick".equals(mode)) return List.of();

        List<ChartSpec> charts = new ArrayList<>();
        int assetCount = c.getPositions().size();

        // 1. 평가액 추이 (line) - 모든 모드 공통
        charts.add(performanceLine(c));

        // 2. 자산 비중
        // <=8자산: donut, 그 이상: treemap (§3.1 매트릭스)
        if (assetCount <= 8) charts.add(allocationDonut(c));
        else charts.add(allocationTreemap(c));

        // 3. 자산별 누적수익률 (multi_line)
        if (!"novice".equals(audience)) {
            charts.add(perAssetMultiLine(c));
        }

        // 4. Drawdown (underwater)
        charts.add(underwater(c));

        // Full 모드 — 추가 차트
        if ("full".equals(mode)) {
            charts.add(returnHistogram(c));
            charts.add(assetClassBar(c));
        }

        return charts;
    }

    // ─────────────────── 개별 차트 ───────────────────

    private ChartSpec performanceLine(Computation c) {
        double[] series = c.getPortfolioValueTimeline();
        double[] bench = c.getBenchmarkPrices();
        int n = series.length;
        List<Object> x = generateDateSequence(n);
        List<Object> y = new ArrayList<>(n);
        List<Object> b = new ArrayList<>(n);
        double s0 = series[0], b0 = bench[0];
        for (int i = 0; i < n; i++) {
            y.add(round((series[i] / s0 - 1.0) * 100, 2));
            b.add(round((bench[i] / b0 - 1.0) * 100, 2));
        }
        ChartData data = new ChartData(x, List.of(y, b), List.of("내 포트폴리오", c.getBenchmarkId()));
        return new ChartSpec(
                "chart_performance",
                "multi_line",
                "기간 누적 수익률 (%) — 벤치마크 대비",
                data,
                new ChartEncoding(
                        new Axis("일자", "time", null),
                        new Axis("수익률(%)", "linear", true),
                        Map.of("내 포트폴리오", "#2563eb", c.getBenchmarkId(), "#94a3b8")
                ),
                null,
                "Simulated (Skills.md GBM, seed=asset_id)",
                "심사용 합성 시계열 — 외부 API 미사용"
        );
    }

    private ChartSpec allocationDonut(Computation c) {
        List<Object> labels = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (PositionEntity p : c.getPositions()) {
            labels.add(p.getAssetName() != null ? p.getAssetName() : p.getAssetId());
            values.add(round(p.getWeight().doubleValue() * 100, 2));
        }
        return new ChartSpec(
                "chart_allocation_donut",
                "donut",
                "자산 비중",
                new ChartData(labels, values, null),
                new ChartEncoding(null, null, null),
                null,
                "Calculated from current quantities × last simulated price",
                null
        );
    }

    private ChartSpec allocationTreemap(Computation c) {
        List<Object> labels = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (PositionEntity p : c.getPositions()) {
            labels.add(p.getAssetName() != null ? p.getAssetName() : p.getAssetId());
            values.add(round(p.getWeight().doubleValue() * 100, 2));
        }
        return new ChartSpec(
                "chart_allocation_treemap",
                "treemap",
                "자산 비중 (Treemap)",
                new ChartData(labels, values, null),
                new ChartEncoding(null, null, null),
                null,
                "Calculated from current weights",
                null
        );
    }

    private ChartSpec perAssetMultiLine(Computation c) {
        int n = c.getPortfolioValueTimeline().length;
        List<Object> x = generateDateSequence(n);
        List<Object> seriesNames = new ArrayList<>();
        List<Object> yMulti = new ArrayList<>();
        for (PositionEntity p : c.getPositions()) {
            double[] prices = c.getPriceMap().get(p.getAssetId());
            List<Object> line = new ArrayList<>(n);
            double p0 = prices[0];
            for (double price : prices) line.add(round((price / p0 - 1.0) * 100, 2));
            yMulti.add(line);
            seriesNames.add(p.getAssetName() != null ? p.getAssetName() : p.getAssetId());
        }
        return new ChartSpec(
                "chart_per_asset_multi_line",
                "multi_line",
                "자산별 누적 수익률 (%)",
                new ChartData(x, yMulti, seriesNames.stream().map(Object::toString).toList()),
                new ChartEncoding(
                        new Axis("일자", "time", null),
                        new Axis("수익률(%)", "linear", true),
                        null
                ),
                null,
                "Simulated",
                null
        );
    }

    private ChartSpec underwater(Computation c) {
        double[] series = c.getPortfolioValueTimeline();
        int n = series.length;
        List<Object> x = generateDateSequence(n);
        List<Object> y = new ArrayList<>(n);
        double peak = series[0];
        for (double v : series) {
            if (v > peak) peak = v;
            y.add(round((v / peak - 1.0) * 100, 2));
        }
        return new ChartSpec(
                "chart_underwater",
                "underwater",
                "Underwater Plot — 낙폭(%)",
                new ChartData(x, y, null),
                new ChartEncoding(
                        new Axis("일자", "time", null),
                        new Axis("낙폭(%)", "linear", true),
                        null
                ),
                null,
                "Calculated from simulated series",
                null
        );
    }

    private ChartSpec returnHistogram(Computation c) {
        double[] series = c.getPortfolioValueTimeline();
        int n = series.length;
        List<Double> rets = new ArrayList<>(n - 1);
        for (int i = 1; i < n; i++) rets.add((series[i] - series[i - 1]) / series[i - 1] * 100);
        rets.sort(Double::compareTo);
        int bins = 20;
        double min = rets.get(0), max = rets.get(rets.size() - 1);
        double step = (max - min) / bins;
        int[] counts = new int[bins];
        for (double r : rets) {
            int idx = (int) Math.min(bins - 1, Math.max(0, Math.floor((r - min) / step)));
            counts[idx]++;
        }
        List<Object> x = new ArrayList<>();
        List<Object> y = new ArrayList<>();
        for (int i = 0; i < bins; i++) {
            x.add(round(min + i * step, 2));
            y.add(counts[i]);
        }
        return new ChartSpec(
                "chart_return_histogram",
                "histogram_box",
                "일별 수익률 분포",
                new ChartData(x, y, null),
                new ChartEncoding(
                        new Axis("일별 수익률(%)", "linear", false),
                        new Axis("일수", "linear", true),
                        null
                ),
                null,
                "Simulated daily returns",
                null
        );
    }

    private ChartSpec assetClassBar(Computation c) {
        Map<String, Double> agg = new LinkedHashMap<>();
        for (PositionEntity p : c.getPositions()) {
            agg.merge(p.getAssetClass(), p.getWeight().doubleValue() * 100, Double::sum);
        }
        List<Object> x = new ArrayList<>();
        List<Object> y = new ArrayList<>();
        for (var e : agg.entrySet()) {
            x.add(e.getKey());
            y.add(round(e.getValue(), 2));
        }
        return new ChartSpec(
                "chart_asset_class_bar",
                "horizontal_bar",
                "자산군별 비중 (%)",
                new ChartData(x, y, null),
                new ChartEncoding(
                        new Axis("자산군", "category", null),
                        new Axis("비중(%)", "linear", true),
                        null
                ),
                null,
                "Aggregated from positions",
                null
        );
    }

    // ─────────────────── 유틸 ───────────────────

    private List<Object> generateDateSequence(int n) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(n - 1);
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        List<Object> out = new ArrayList<>(n);
        for (int i = 0; i < n; i++) out.add(start.plusDays(i).format(fmt));
        return out;
    }

    private static double round(double v, int decimals) {
        double scale = Math.pow(10, decimals);
        return Math.round(v * scale) / scale;
    }
}
