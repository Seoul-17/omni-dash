package com.omnidash.service.metrics;

import com.omnidash.domain.entity.PositionEntity;
import com.omnidash.service.skills.SkillsConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Skills 02 핵심 — 시맨틱 레이어 지표 산출.
 * 시뮬레이션된 가격 시계열로부터 returns / risk / risk_adjusted 지표를 계산.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MetricsEngine {

    private final PriceSimulator simulator;
    private final SkillsConfig skills;
    private final FxRates fx;

    public Computation compute(List<PositionEntity> positions, String benchmarkId, String riskProfile) {
        return compute(positions, benchmarkId, riskProfile, "KRW");
    }

    public Computation compute(List<PositionEntity> positions, String benchmarkId,
                                String riskProfile, String baseCurrency) {
        if (positions == null || positions.isEmpty()) {
            throw new IllegalArgumentException("Empty positions");
        }
        int n = skills.simulationTradingDays();

        // 1) 각 자산 가격 시계열 시뮬레이션 (시작가 = avg_cost)
        Map<String, double[]> priceMap = new LinkedHashMap<>();
        for (PositionEntity p : positions) {
            double start = p.getAvgCost() == null || p.getAvgCost().signum() <= 0
                    ? 100.0
                    : p.getAvgCost().doubleValue();
            priceMap.put(p.getAssetId(), simulator.simulate(p.getAssetId(), p.getAssetClass(), start));
        }

        // 2) 자산별 평가금액 시계열 (qty × price × FX → base_currency)
        Map<String, double[]> valueMap = new LinkedHashMap<>();
        for (PositionEntity p : positions) {
            double[] prices = priceMap.get(p.getAssetId());
            double qty = p.getQuantity().doubleValue();
            String from = p.getBaseCurrency() == null || p.getBaseCurrency().isBlank()
                    ? baseCurrency : p.getBaseCurrency();
            double rate = fx.rate(from, baseCurrency);
            double[] v = new double[n];
            for (int i = 0; i < n; i++) v[i] = prices[i] * qty * rate;
            valueMap.put(p.getAssetId(), v);
        }

        // 3) 포트폴리오 총평가액 시계열
        double[] portValue = new double[n];
        for (int i = 0; i < n; i++) {
            double s = 0;
            for (double[] v : valueMap.values()) s += v[i];
            portValue[i] = s;
        }

        // 4) 가중치 재계산 (마지막 시점 기준)
        double lastValue = portValue[n - 1];
        for (PositionEntity p : positions) {
            double w = valueMap.get(p.getAssetId())[n - 1] / lastValue;
            p.setWeight(BigDecimal.valueOf(w).setScale(6, RoundingMode.HALF_UP));
        }

        // 5) 일별 수익률
        double[] simpleRet = new double[n - 1];
        double[] logRet = new double[n - 1];
        for (int i = 1; i < n; i++) {
            simpleRet[i - 1] = portValue[i] / portValue[i - 1] - 1.0;
            logRet[i - 1] = Math.log(portValue[i] / portValue[i - 1]);
        }

        // 6) 누적·CAGR
        double cumulative = portValue[n - 1] / portValue[0] - 1.0;
        double years = (double) n / 252.0;
        double cagr = Math.pow(portValue[n - 1] / portValue[0], 1.0 / years) - 1.0;

        // 7) 위험 지표
        double rf = skills.parameter("risk_free_rate", 0.04);
        double mean = mean(logRet);
        double std = std(logRet);                       // 일별
        double annualizedStd = std * Math.sqrt(252);    // 연환산
        double meanAnnual = mean * 252;
        double downsideDev = downsideDeviation(simpleRet, rf / 252.0) * Math.sqrt(252);
        double mdd = maxDrawdown(portValue);            // 음수, 비율
        int recoveryDays = recoveryDays(portValue);
        double var95 = -percentile(simpleRet, 0.05);    // 일별
        double cvar95 = -cvar(simpleRet, 0.05);
        double calmar = mdd >= 0 ? 0 : cagr / Math.abs(mdd);
        double sortino = downsideDev > 1e-9 ? (meanAnnual - rf) / downsideDev : 0.0;
        double sharpe = annualizedStd > 1e-9 ? (meanAnnual - rf) / annualizedStd : 0.0;

        // 8) 벤치마크 비교
        double[] benchPrices = simulator.simulateBenchmark(benchmarkId);
        double[] benchLog = new double[n - 1];
        for (int i = 1; i < n; i++) benchLog[i - 1] = Math.log(benchPrices[i] / benchPrices[i - 1]);
        double benchCum = benchPrices[n - 1] / benchPrices[0] - 1.0;

        double[] benchMeanCentered = subtract(benchLog, mean(benchLog));
        double[] portMeanCentered = subtract(logRet, mean);
        double cov = covariance(portMeanCentered, benchMeanCentered);
        double benchVar = variance(benchMeanCentered);
        double beta = benchVar > 1e-12 ? cov / benchVar : 1.0;
        double alpha = (meanAnnual - rf) - beta * (mean(benchLog) * 252 - rf);
        double rSquared = Math.pow(pearson(logRet, benchLog), 2);

        double trackingError = std(subtract(simpleRet, toDailySimple(benchLog))) * Math.sqrt(252);
        double infoRatio = trackingError > 1e-9 ? (cumulative - benchCum) / trackingError : 0.0;
        double treynor = Math.abs(beta) > 0.1 ? (meanAnnual - rf) / beta : 0.0;

        // 9) 자산군별 임계 적용
        double profileAdj = 1.0 + skills.riskProfileAdjust(riskProfile);
        Map<String, String> classSeverity = evaluateThresholds(positions, mdd, sharpe, calmar, cvar95, profileAdj);

        return Computation.builder()
                .positions(positions)
                .priceMap(priceMap)
                .valueMap(valueMap)
                .portfolioValueTimeline(portValue)
                .benchmarkPrices(benchPrices)
                .benchmarkId(benchmarkId)
                .simpleReturn(cumulative)
                .logReturn(Math.log1p(cumulative))
                .cumulativeReturn(cumulative)
                .cagr(cagr)
                .sigma(annualizedStd)
                .downsideDeviation(downsideDev)
                .mdd(mdd)
                .recoveryDays(recoveryDays)
                .var95(var95)
                .cvar95(cvar95)
                .sortino(sortino)
                .sharpe(sharpe)
                .calmar(calmar)
                .beta(beta)
                .alpha(alpha)
                .rSquared(rSquared)
                .trackingError(trackingError)
                .infoRatio(infoRatio)
                .treynor(treynor)
                .benchmarkCumulativeReturn(benchCum)
                .sampleSize(simpleRet.length)
                .assetClassSeverity(classSeverity)
                .build();
    }

    // ───────── 임계 평가 ─────────

    @SuppressWarnings("unchecked")
    private Map<String, String> evaluateThresholds(List<PositionEntity> positions,
                                                    double mdd, double sharpe, double calmar,
                                                    double cvar95, double profileAdj) {
        Map<String, BigDecimal> classWeight = new LinkedHashMap<>();
        for (PositionEntity p : positions) {
            classWeight.merge(p.getAssetClass(), p.getWeight(), BigDecimal::add);
        }
        Map<String, String> out = new LinkedHashMap<>();
        for (String cls : classWeight.keySet()) {
            Map<String, Object> t = skills.assetClass(cls);
            if (t.isEmpty()) {
                out.put(cls, "info");
                continue;
            }
            double mddWarn = num(t.get("mdd_warn"), -0.20) * profileAdj;
            double sharpeGood = num(t.get("sharpe_good"), 1.0) * profileAdj;
            double cvarWarn = num(t.get("cvar_warn"), -0.03) * profileAdj;
            double calmarGood = num(t.get("calmar_good"), 0.5) * profileAdj;

            int bad = 0;
            if (mdd <= mddWarn) bad++;
            if (sharpe < sharpeGood) bad++;
            if (cvar95 <= cvarWarn) bad++;
            if (calmar < calmarGood) bad++;

            String sev = bad >= 3 ? "critical" : bad >= 1 ? "warn" : "info";
            out.put(cls, sev);
        }
        return out;
    }

    private static double num(Object v, double d) {
        if (v instanceof Number n) return n.doubleValue();
        if (v instanceof List<?> l && !l.isEmpty() && l.get(0) instanceof Number n) return n.doubleValue();
        return d;
    }

    // ───────── 통계 유틸 ─────────

    private static double mean(double[] a) {
        double s = 0;
        for (double v : a) s += v;
        return a.length == 0 ? 0 : s / a.length;
    }

    private static double std(double[] a) { return Math.sqrt(variance(a)); }

    private static double variance(double[] a) {
        if (a.length < 2) return 0;
        double m = mean(a);
        double s = 0;
        for (double v : a) s += (v - m) * (v - m);
        return s / (a.length - 1);
    }

    private static double downsideDeviation(double[] a, double mar) {
        if (a.length == 0) return 0;
        double s = 0;
        for (double v : a) {
            double d = Math.min(v - mar, 0);
            s += d * d;
        }
        return Math.sqrt(s / a.length);
    }

    private static double maxDrawdown(double[] series) {
        double peak = series[0];
        double mdd = 0;
        for (double v : series) {
            if (v > peak) peak = v;
            double dd = (v - peak) / peak;
            if (dd < mdd) mdd = dd;
        }
        return mdd;
    }

    private static int recoveryDays(double[] series) {
        double peak = series[0];
        int peakIdx = 0;
        double mdd = 0;
        int mddIdx = 0;
        for (int i = 0; i < series.length; i++) {
            if (series[i] > peak) { peak = series[i]; peakIdx = i; }
            double dd = (series[i] - peak) / peak;
            if (dd < mdd) { mdd = dd; mddIdx = i; }
        }
        // mdd 이후 peak 회복까지 영업일
        for (int i = mddIdx; i < series.length; i++) {
            if (series[i] >= peak) return i - peakIdx;
        }
        return -1; // 회복 미달성
    }

    private static double percentile(double[] arr, double p) {
        if (arr.length == 0) return 0;
        double[] sorted = arr.clone();
        Arrays.sort(sorted);
        int idx = (int) Math.floor(p * (sorted.length - 1));
        return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
    }

    private static double cvar(double[] arr, double p) {
        if (arr.length == 0) return 0;
        double[] sorted = arr.clone();
        Arrays.sort(sorted);
        int cutoff = (int) Math.floor(p * sorted.length);
        if (cutoff < 1) cutoff = 1;
        double s = 0;
        for (int i = 0; i < cutoff; i++) s += sorted[i];
        return s / cutoff;
    }

    private static double covariance(double[] a, double[] b) {
        int n = Math.min(a.length, b.length);
        if (n < 2) return 0;
        double s = 0;
        for (int i = 0; i < n; i++) s += a[i] * b[i];
        return s / (n - 1);
    }

    private static double pearson(double[] a, double[] b) {
        int n = Math.min(a.length, b.length);
        if (n < 2) return 0;
        double ma = mean(a), mb = mean(b);
        double num = 0, da = 0, db = 0;
        for (int i = 0; i < n; i++) {
            double xa = a[i] - ma, xb = b[i] - mb;
            num += xa * xb;
            da += xa * xa;
            db += xb * xb;
        }
        return (da * db) <= 0 ? 0 : num / Math.sqrt(da * db);
    }

    private static double[] subtract(double[] a, double v) {
        double[] r = new double[a.length];
        for (int i = 0; i < a.length; i++) r[i] = a[i] - v;
        return r;
    }

    private static double[] subtract(double[] a, double[] b) {
        int n = Math.min(a.length, b.length);
        double[] r = new double[n];
        for (int i = 0; i < n; i++) r[i] = a[i] - b[i];
        return r;
    }

    private static double[] toDailySimple(double[] log) {
        double[] r = new double[log.length];
        for (int i = 0; i < log.length; i++) r[i] = Math.expm1(log[i]);
        return r;
    }

    @lombok.Builder
    @lombok.Getter
    public static class Computation {
        List<PositionEntity> positions;
        Map<String, double[]> priceMap;
        Map<String, double[]> valueMap;
        double[] portfolioValueTimeline;
        double[] benchmarkPrices;
        String benchmarkId;
        double simpleReturn;
        double logReturn;
        double cumulativeReturn;
        double cagr;
        double sigma;
        double downsideDeviation;
        double mdd;
        int recoveryDays;
        double var95;
        double cvar95;
        double sortino;
        double sharpe;
        double calmar;
        double beta;
        double alpha;
        double rSquared;
        double trackingError;
        double infoRatio;
        double treynor;
        double benchmarkCumulativeReturn;
        int sampleSize;
        Map<String, String> assetClassSeverity;
    }
}
