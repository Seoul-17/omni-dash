package com.omnidash.service.insight;

import com.omnidash.domain.entity.PositionEntity;
import com.omnidash.dto.DashboardOutput.Insight;
import com.omnidash.dto.DashboardOutput.Ref;
import com.omnidash.service.metrics.MetricsEngine.Computation;
import com.omnidash.service.skills.SkillsConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

/**
 * Skills 04_report_skills.md §4.4 임계 트리거 기반 룰 NLG.
 * LLM 없이도 구조화된 인사이트 생성 (icon은 InsightIcon literal union — 환각 방지).
 */
@Service
@RequiredArgsConstructor
public class InsightEngine {

    private final SkillsConfig skills;

    public List<Insight> generate(Computation c, String audience, String mode) {
        List<Insight> out = new ArrayList<>();
        String period = "%d trading days".formatted(c.getSampleSize() + 1);
        int n = c.getSampleSize() + 1;

        double profileAdj = 1.0; // 임계 강도는 이미 MetricsEngine에서 반영됨

        // 1) 자산군별 집중 (Skills 02 §2.4.1 concentration_warn)
        Map<String, BigDecimal> classWeight = new LinkedHashMap<>();
        for (PositionEntity p : c.getPositions()) {
            classWeight.merge(p.getAssetClass(), p.getWeight(), BigDecimal::add);
        }
        for (PositionEntity p : c.getPositions()) {
            Map<String, Object> t = skills.assetClass(p.getAssetClass());
            double warn = num(t.get("concentration_warn"), 0.30);
            double w = p.getWeight().doubleValue();
            if (w > warn) {
                out.add(new Insight(
                        "warn",
                        "🎯",
                        "%s 단일 자산 비중 임계 초과".formatted(p.getAssetName() != null ? p.getAssetName() : p.getAssetId()),
                        "%s 비중 %.1f%%로 %s 자산군 임계(%.0f%%) 초과".formatted(
                                p.getAssetName() != null ? p.getAssetName() : p.getAssetId(),
                                w * 100, p.getAssetClass(), warn * 100),
                        "자산군 변동성이 포트폴리오 전체 변동성을 비대칭적으로 증폭시킬 위험",
                        "비중을 %.0f%% 이하로 트림하거나 비상관 자산 편입 검토".formatted(warn * 100),
                        List.of("weight." + p.getAssetId(), "concentration." + p.getAssetClass()),
                        new Ref("concentration", period, c.getPositions().size())
                ));
            }
        }

        // 2) MDD 임계 (가중평균)
        double weightedMddWarn = weightedThreshold(c, "mdd_warn", -0.20) * profileAdj;
        if (c.getMdd() <= weightedMddWarn) {
            out.add(new Insight(
                    "warn",
                    "🔻",
                    "최대 낙폭(MDD) 자산군 가중 임계 초과",
                    "MDD %.1f%%로 가중 임계 %.1f%% 초과".formatted(c.getMdd() * 100, weightedMddWarn * 100),
                    "현 추세 지속 시 자본 잠식 심화 가능",
                    "방어 자산 비중 5~10%p 상향 또는 변동성 헷지 검토",
                    List.of("mdd", "recovery_days", "cvar_95"),
                    new Ref("mdd", period, n)
            ));
        }

        // 3) Sharpe 임계 (가중평균)
        double sharpeGood = weightedThreshold(c, "sharpe_good", 1.0) * profileAdj;
        if (c.getSharpe() < sharpeGood) {
            out.add(new Insight(
                    "warn",
                    "📉",
                    "샤프 비율 자산군 임계 미달",
                    "샤프 %.2f로 가중 임계(%.2f) 미달".formatted(c.getSharpe(), sharpeGood),
                    "총 위험 대비 보상이 양호 수준 미달, 위험 효율 개선 필요",
                    "리밸런싱 또는 변동성 감소를 위한 채권/금 편입 검토",
                    List.of("sharpe", "downside_dev"),
                    new Ref("sharpe", period, n)
            ));
        }

        // 4) CVaR 임계 (가중평균)
        double cvarWarn = weightedThreshold(c, "cvar_warn", -0.03) * profileAdj;
        if (c.getCvar95() <= cvarWarn) {
            out.add(new Insight(
                    "warn",
                    "💥",
                    "CVaR(꼬리 위험) 임계 초과",
                    "일별 CVaR(95%%) %.2f%%로 임계(%.2f%%) 초과".formatted(c.getCvar95() * 100, cvarWarn * 100),
                    "극단적 하락 구간의 평균 손실이 자산군 통상치를 상회",
                    "옵션 헤지·달러 코스트 평균 분할매수 등 꼬리 위험 완화 전략 고려",
                    List.of("cvar_95", "var_95"),
                    new Ref("cvar_95", period, c.getSampleSize())
            ));
        }

        // 5) 회복 미달 경고
        if (c.getRecoveryDays() < 0) {
            out.add(new Insight(
                    "warn",
                    "⏳",
                    "MDD 회복 미달성",
                    "분석 기간 내 직전 최고가 회복 미달성",
                    "장기 침체 가능성 — 펀더멘털 재점검 필요",
                    "보유 자산의 매크로 환경·실적 흐름 재검토",
                    List.of("recovery_days", "mdd"),
                    new Ref("recovery_days", period, n)
            ));
        } else if (c.getRecoveryDays() > skills.parameter("recovery_warning_days", 252)) {
            out.add(new Insight(
                    "info",
                    "⏳",
                    "MDD 회복 기간 장기",
                    "%d영업일 만에 회복 — 임계(252) 초과".formatted(c.getRecoveryDays()),
                    "위기 후 회복력이 평균 미달",
                    "방어 자산 편입 및 분할 매수 전략 검토",
                    List.of("recovery_days", "calmar"),
                    new Ref("recovery_days", period, n)
            ));
        }

        // 6) 단일 자산군 노출 (시연 1 케이스)
        if (classWeight.size() == 1) {
            String cls = classWeight.keySet().iterator().next();
            out.add(new Insight(
                    "info",
                    "📊",
                    "단일 자산군 노출 — 분산 효과 제한",
                    "포트폴리오 전체가 %s 자산군 100%%로 구성".formatted(cls),
                    "자산군 분산이 부재해 시장 사이클·정책 변동에 비대칭 노출",
                    "ETF·채권·해외 자산 등 비상관 자산군 편입 검토",
                    List.of("concentration." + cls),
                    new Ref("concentration", "snapshot", c.getPositions().size())
            ));
        }

        // 7) 통계 유의성 경고 (Skills 02 §2.5)
        if (c.getSampleSize() < 30) {
            out.add(new Insight(
                    "info",
                    "⚠️",
                    "낮은 통계적 유의성",
                    "표본 %d개로 통계 보통 미만".formatted(c.getSampleSize()),
                    "지표 해석에 주의 — 향후 데이터 누적 시 재평가 권장",
                    "데이터 누적 후 재분석",
                    List.of("sample_size"),
                    new Ref("sample_size", period, c.getSampleSize())
            ));
        }

        // Quick 모드는 최대 1개
        if ("quick".equals(mode) && out.size() > 1) return out.subList(0, 1);

        // Novice audience는 critical/warn 우선 노출, info는 최대 1개
        if ("novice".equals(audience)) {
            List<Insight> primary = new ArrayList<>();
            int infoCount = 0;
            for (Insight i : out) {
                if ("info".equals(i.severity())) {
                    if (infoCount < 1) { primary.add(i); infoCount++; }
                } else primary.add(i);
            }
            return primary;
        }
        return out;
    }

    private double weightedThreshold(Computation c, String key, double fallback) {
        double total = 0.0;
        double w = 0.0;
        for (PositionEntity p : c.getPositions()) {
            Map<String, Object> t = skills.assetClass(p.getAssetClass());
            double v = num(t.get(key), fallback);
            double weight = p.getWeight().doubleValue();
            total += v * weight;
            w += weight;
        }
        return w > 0 ? total / w : fallback;
    }

    private static double num(Object v, double d) {
        if (v instanceof Number n) return n.doubleValue();
        if (v instanceof List<?> l && !l.isEmpty() && l.get(0) instanceof Number n) return n.doubleValue();
        return d;
    }
}
