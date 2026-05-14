package com.omnidash.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/**
 * Skills 05_contract_skills.md §6.1 DashboardOutput TypeScript 미러링.
 * 본 DTO를 그대로 JSON 직렬화하면 프론트엔드의 types/dashboard.ts와 1:1 매칭된다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DashboardOutput(
        Meta meta,
        List<KPI> kpis,
        List<ChartSpec> charts,
        Report report,
        List<Insight> insights,
        SemanticMetrics raw_metrics
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Meta(
            String generated_at,
            String skill_version,
            String mode,            // quick | standard | full
            String audience,        // novice | intermediate | expert
            Period input_period,
            String base_currency,
            String risk_profile,    // conservative | moderate | aggressive
            String locale,
            List<PortfolioMeta> portfolios,
            String cache_key,
            List<String> invalidated,
            ConflictResolution conflict_resolution,
            List<String> warnings
    ) {}

    public record Period(String start, String end) {}

    public record PortfolioMeta(String portfolio_id, String name, String source) {}

    public record ConflictResolution(String rule, String applied) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record KPI(
            String id,
            String label,
            double value,
            String unit,             // % | x | currency | score | days
            Double change,
            String semantic_color,   // positive | negative | neutral
            String severity,         // info | warn | critical
            Ref ref
    ) {}

    public record Ref(String metric, String period, int n) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ChartSpec(
            String id,
            String type,
            String title,
            ChartData data,
            ChartEncoding encoding,
            List<Annotation> annotations,
            String source,
            String caveat
    ) {}

    public record ChartData(List<Object> x, List<Object> y, List<String> series) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ChartEncoding(
            Axis x_axis,
            Axis y_axis,
            Map<String, String> color_map
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Axis(String label, String type, Boolean zero_baseline) {}

    public record Annotation(Object x, double y, String text) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Report(
            ReportSection.Bluf B,
            ReportSection.UContext U,
            ReportSection.Investigate I,
            ReportSection.Liability L,
            ReportSection.Direction D
    ) {}

    public static class ReportSection {
        public record Bluf(String bluf, List<KPI> kpis) {}
        public record UContext(String context, BenchmarkComparison benchmark) {}
        public record Investigate(List<Attribution> contributors,
                                  List<Attribution> detractors,
                                  String anchor_chart_id) {}
        public record Liability(RiskMetrics risk_metrics, List<Scenario> scenarios) {}
        public record Direction(List<ActionItem> actions, List<String> monitoring) {}
    }

    public record Attribution(
            String asset_id,
            String asset_name,
            double contribution_pct,
            double weight,
            double return_pct
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RiskMetrics(
            double mdd,
            Integer recovery_days,
            double downside_dev,
            double sortino,
            double var_95,
            double cvar_95,
            double calmar,
            Map<String, String> asset_class_thresholds
    ) {}

    public record Scenario(
            String label,             // optimistic | base | pessimistic
            double expected_return,
            double expected_mdd,
            List<String> assumptions
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ActionItem(
            String action,            // rebalance | trim | add | hold | review
            String asset_id,
            Double target_weight,
            String deadline,
            String rationale
    ) {}

    public record Insight(
            String severity,
            String icon,
            String title,
            String observation,
            String implication,
            String recommended_action,
            List<String> follow_up_metrics,
            Ref ref
    ) {}

    public record BenchmarkComparison(
            String benchmark_id,
            double absolute_return,
            double relative_return,
            double tracking_error,
            List<Attribution> attribution
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SemanticMetrics(
            Returns returns,
            RiskMetrics risk,
            RiskAdjusted risk_adjusted,
            BenchmarkRef benchmark,
            int sample_size
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Returns(
            double simple,
            double log,
            double cumulative,
            double cagr,
            Double pre_tax,
            Double post_tax
    ) {}

    public record RiskAdjusted(
            double sharpe,
            double treynor,
            double info_ratio,
            double alpha,
            double beta,
            double r_squared
    ) {}

    public record BenchmarkRef(String id, double performance) {}
}
