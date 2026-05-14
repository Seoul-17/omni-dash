/**
 * Skills 05_contract_skills.md §6.1 DashboardOutput 1:1 미러링.
 * 백엔드 com.omnidash.dto.DashboardOutput과 동일한 snake_case 필드 사용.
 */

export type Severity = 'info' | 'warn' | 'critical';
export type Mode = 'quick' | 'standard' | 'full';
export type Audience = 'novice' | 'intermediate' | 'expert';
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';
export type ValueDirection = 'positive' | 'negative' | 'neutral';

export type ChartType =
  | 'candlestick' | 'line' | 'multi_line' | 'small_multiples'
  | 'heatmap' | 'correlation_evolution'
  | 'donut' | 'treemap'
  | 'waterfall' | 'factor_attribution'
  | 'horizontal_bar' | 'histogram_box' | 'drawdown_dist'
  | 'bubble' | 'efficient_frontier'
  | 'big_number_sparkline' | 'underwater' | 'rolling_window';

export interface Ref {
  metric: string;
  period: string;
  n: number;
}

export interface KPI {
  id: string;
  label: string;
  value: number;
  unit: '%' | 'x' | 'currency' | 'score' | 'days';
  change?: number;
  semantic_color: ValueDirection;
  severity?: Severity;
  ref: Ref;
}

export interface Axis {
  label: string;
  type: 'time' | 'category' | 'linear' | 'log';
  zero_baseline?: boolean;
}

export interface ChartSpec {
  id: string;
  type: ChartType;
  title: string;
  data: {
    x: (string | number)[];
    y: (number | (number | string)[])[];  // 단일 시리즈 또는 다중
    series?: string[];
  };
  encoding: {
    x_axis?: Axis;
    y_axis?: Axis;
    color_map?: Record<string, string>;
  };
  annotations?: { x: string | number; y: number; text: string }[];
  source: string;
  caveat?: string;
}

export interface RiskMetrics {
  mdd: number;
  recovery_days: number | null;
  downside_dev: number;
  sortino: number;
  var_95: number;
  cvar_95: number;
  calmar: number;
  asset_class_thresholds: Partial<Record<string, Severity>>;
}

export interface RiskAdjusted {
  sharpe: number;
  treynor: number;
  info_ratio: number;
  alpha: number;
  beta: number;
  r_squared: number;
}

export interface SemanticMetrics {
  returns: {
    simple: number;
    log: number;
    cumulative: number;
    cagr: number;
    pre_tax?: number;
    post_tax?: number;
  };
  risk: RiskMetrics;
  risk_adjusted: RiskAdjusted;
  benchmark: { id: string; performance: number };
  sample_size: number;
}

export interface Insight {
  severity: Severity;
  icon: string;
  title: string;
  observation: string;
  implication: string;
  recommended_action: string;
  follow_up_metrics: string[];
  ref: Ref;
}

export interface Attribution {
  asset_id: string;
  asset_name: string;
  contribution_pct: number;
  weight: number;
  return_pct: number;
}

export interface ActionItem {
  action: 'rebalance' | 'trim' | 'add' | 'hold' | 'review';
  asset_id?: string;
  target_weight?: number;
  deadline?: string;
  rationale: string;
}

export interface Scenario {
  label: 'optimistic' | 'base' | 'pessimistic';
  expected_return: number;
  expected_mdd: number;
  assumptions: string[];
}

export interface BenchmarkComparison {
  benchmark_id: string;
  absolute_return: number;
  relative_return: number;
  tracking_error: number;
  attribution: Attribution[];
}

export interface Report {
  B: { bluf: string; kpis: KPI[] };
  U: { context: string; benchmark: BenchmarkComparison };
  I: { contributors: Attribution[]; detractors: Attribution[]; anchor_chart_id: string };
  L: { risk_metrics: RiskMetrics; scenarios: Scenario[] };
  D: { actions: ActionItem[]; monitoring: string[] };
}

export interface PortfolioMeta {
  portfolio_id: string;
  name: string;
  source: string;
}

export interface DashboardOutput {
  meta: {
    generated_at: string;
    skill_version: string;
    mode: Mode;
    audience: Audience;
    input_period: { start: string; end: string };
    base_currency: string;
    risk_profile: RiskProfile;
    locale: string;
    portfolios?: PortfolioMeta[];
    cache_key?: string;
    invalidated?: string[];
    conflict_resolution?: { rule: string; applied: string };
    warnings: string[];
  };
  kpis: KPI[];
  charts: ChartSpec[];
  report?: Report;
  insights: Insight[];
  raw_metrics: SemanticMetrics;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  source: string;
  createdAt: string;
  baseCurrency: string;
  riskProfile: RiskProfile;
  audience: Audience;
}

export interface UploadResponse {
  portfolioId: string;
  name: string;
  source: string;
  rowCount: number;
  warnings: string[];
}
