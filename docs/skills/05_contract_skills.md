---
name: financial-dashboard-contract
role: 출력 계약·모드별 채움·캐시·핫리로드·E2E 예시
version: 3.0.0
license: Apache-2.0
applies_to: [stage-6]
depends_on: [00_core_skills.md, 02_metrics_skills.md, 03_visualization_skills.md, 04_report_skills.md]
loaded_when: 출력 직렬화·캐시 단계 (모든 단계 완료 후)
---

# 05. Contract Skills — 출력 계약·캐시·E2E

> 프론트엔드가 받아 렌더링할 JSON 구조와 캐시·핫리로드 정책을 정의한다. 본 파일이 백엔드-프론트 인터페이스의 단일 진실 원천.
>
> **사전 조건**: 모든 단계(`→ 01_data` ~ `→ 04_report`) 완료.
> **다음 단계**: 프론트엔드(React/Vue) 렌더링.

---

## 6.1 인터페이스 (Output Contract)

```typescript
// ── enum 통일 ──
type Severity = "info" | "warn" | "critical";
type AssetClass = "equity" | "etf" | "fund" | "bond" | "crypto" | "commodity";
type Mode = "quick" | "standard" | "full";
type Audience = "novice" | "intermediate" | "expert";
type RiskProfile = "conservative" | "moderate" | "aggressive";

// 색상은 의미 차원 분리: 값 방향성(KPI) vs 심각도(Insight)
type ValueDirection = "positive" | "negative" | "neutral";

type InsightIcon =
  | "⚠️" | "⚡" | "🔻" | "🎯" | "🔗" | "📈"
  | "💥" | "⏳" | "📉" | "💼" | "📊";

type ChartType =
  | "candlestick" | "line" | "multi_line" | "small_multiples"
  | "heatmap" | "correlation_evolution"
  | "donut" | "treemap"
  | "waterfall" | "factor_attribution"
  | "horizontal_bar" | "histogram_box" | "drawdown_dist"
  | "bubble" | "efficient_frontier"
  | "big_number_sparkline" | "underwater" | "rolling_window";

// ── 최상위 ──
interface DashboardOutput {
  meta: {
    generated_at: string;            // ISO-8601
    skill_version: string;           // "3.0.0"
    mode: Mode;
    audience: Audience;
    input_period: { start: string; end: string };
    base_currency: string;
    risk_profile: RiskProfile;
    locale: "ko-KR" | "en-US";
    portfolios?: PortfolioMeta[];
    cache_key?: string;              // §6.3
    invalidated?: string[];          // 핫리로드 시 무효화된 영역
    conflict_resolution?: {          // → 00_core_skills.md §0.3.1
      rule: string;
      applied: string;
    };
    warnings: string[];
  };
  kpis: KPI[];
  charts: ChartSpec[];               // Quick 모드 시 []
  report?: {                         // Quick 모드 시 생략
    B: { bluf: string; kpis: KPI[] };
    U: { context: string; benchmark: BenchmarkComparison };
    I: { contributors: Attribution[]; detractors: Attribution[]; anchor_chart_id: string };
    L: { risk_metrics: RiskMetrics; scenarios: Scenario[] };
    D: { actions: ActionItem[]; monitoring: string[] };
  };
  insights: Insight[];
  raw_metrics: SemanticMetrics;
}

interface PortfolioMeta {
  portfolio_id: string;
  name: string;
  source: "transactions" | "holdings" | "merged";
}

interface KPI {
  id: string;
  label: string;
  value: number;
  unit: "%" | "x" | "currency" | "score" | "days";
  change?: number;
  semantic_color: ValueDirection;    // 값 방향성만 (positive/negative/neutral)
  severity?: Severity;               // 임계 도달 여부 (분리된 차원)
  ref: { metric: string; period: string; n: number };
}

interface ChartSpec {
  id: string;
  type: ChartType;
  title: string;
  data: { x: any[]; y: any[]; series?: string[] };
  encoding: {
    x_axis?: { label: string; type: "time" | "category" | "linear" };
    y_axis?: { label: string; type: "linear" | "log"; zero_baseline: boolean };
    color_map?: Record<string, string>;
  };
  annotations?: { x: any; y: number; text: string }[];
  source: string;                    // "Yahoo Finance / 2026-04-30 종가"
  caveat?: string;
}

interface Attribution {
  asset_id: string;
  asset_name: string;
  contribution_pct: number;
  weight: number;
  return_pct: number;
}

interface RiskMetrics {              // sortino 단일 위치 (중복 제거)
  mdd: number;
  recovery_days: number | null;
  downside_dev: number;
  sortino: number;
  var_95: number;
  cvar_95: number;
  calmar: number;
  asset_class_thresholds: Partial<Record<AssetClass, Severity>>;
}

interface Scenario {
  label: "optimistic" | "base" | "pessimistic";
  expected_return: number;
  expected_mdd: number;
  assumptions: string[];
}

interface ActionItem {
  action: "rebalance" | "trim" | "add" | "hold" | "review";
  asset_id?: string;
  target_weight?: number;
  deadline?: string;                 // ISO-8601
  rationale: string;
}

interface Insight {
  severity: Severity;
  icon: InsightIcon;                 // literal — 환각 방지
  title: string;
  observation: string;
  implication: string;
  recommended_action: string;
  follow_up_metrics: string[];
  ref: { metric: string; period: string; n: number };
}

interface BenchmarkComparison {      // tracking_error 단일 위치 (중복 제거)
  benchmark_id: string;
  absolute_return: number;
  relative_return: number;
  tracking_error: number;
  attribution: Attribution[];
}

interface SemanticMetrics {          // sortino·tracking_error 중복 제거
  returns: {
    simple: number; log: number; cumulative: number; cagr: number;
    pre_tax?: number; post_tax?: number;
  };
  risk: RiskMetrics;
  risk_adjusted: {
    sharpe: number; treynor: number; info_ratio: number;
    alpha: number; beta: number; r_squared: number;
  };
  benchmark: { id: string; performance: number };  // tracking_error는 BenchmarkComparison에만
  sample_size: number;
}
```

### 6.1.1 v2.0.0 → 3.0.0 타입 정밀화 (NEW)

- `asset_class_thresholds`: `Record<string, ...>` → `Partial<Record<AssetClass, ...>>` (자산군 enum 강제)
- `KPI.semantic_color`: 7색 union → `ValueDirection` 3색 + `severity` 별도 필드 (의미 차원 분리)
- `Insight.icon`: `string` → `InsightIcon` literal union (LLM 환각 방지)
- `Mode`·`Audience`·`RiskProfile`·`ChartType`을 named type으로 추출 (재사용성)

마이그레이션: `→ CHANGELOG.md` v3.0.0 항목.

---

## 6.2 모드별 필드 채움 규칙

| 필드 | Quick | Standard | Full |
|---|---|---|---|
| `meta` | ✅ | ✅ | ✅ |
| `kpis` | 1개 (질의 지표) | 3~5개 | 모든 핵심 KPI |
| `charts` | `[]` | 3~4개 | 6~8개 |
| `report` | 생략 | 5단 요약 | 5단 전체 |
| `insights` | §4.4 트리거 1개 | 트리거 모두 | 트리거 + 비조건부 |
| `raw_metrics` | 질의 지표만 | 전체 | 전체 |

---

## 6.3 캐시·핫리로드 정책

기획서 §5 시연 3 "Skills.md 텍스트 수정 → 즉시 반영" 보장.

### 6.3.1 캐시 키

```
cache_key = SHA-256(
  input_data_hash,
  skill_version,
  audience,
  mode,
  risk_profile,
  locale
)
```

TTL: 사용자 세션 + 24시간. 명시 invalidation 우선.

### 6.3.2 무효화 규칙

- `skill_version` 변경 → 모든 캐시 무효
- `analysis_config` 임계값 수정 → §2.4.1 임계 의존 인사이트만 무효
- 입력 데이터 추가 → 해당 portfolio_id 캐시만 무효
- 동일 cache_key 동시 요청 시 첫 요청 결과 공유 (cache stampede 방지)

### 6.3.3 의존성 그래프

| 변경 위치 | 영향 받는 출력 |
|---|---|
| `→ 02_metrics_skills.md §2` 시맨틱 변경 | KPI · report · raw_metrics 전체 재계산 |
| `→ 02_metrics_skills.md §2.4.1` 임계 변경 | insights · `RiskMetrics.asset_class_thresholds`만 |
| `→ 03_visualization_skills.md §3.1` 매트릭스 변경 | charts만 재렌더 |
| `→ 04_report_skills.md §4.7` 용어 사전 변경 | novice audience 출력 텍스트만 |
| `→ 00_core_skills.md §0.3.1` 충돌 해소 변경 | 충돌 발생 케이스만 |

핫리로드 시 `meta.cache_key` + `meta.invalidated: ["insights", ...]` 명시.

---

## 6.4 E2E 예시

### 6.4.1 Quick 모드 (단일 지표)

**입력**: `"내 포트폴리오 MDD만 알려줘"`

**출력 (발췌)**:
```json
{
  "meta": {
    "skill_version": "3.0.0",
    "mode": "quick",
    "audience": "intermediate",
    "input_period": { "start": "2025-01-15", "end": "2026-04-30" },
    "base_currency": "KRW",
    "risk_profile": "moderate",
    "locale": "ko-KR",
    "warnings": []
  },
  "kpis": [
    {
      "id": "kpi_mdd",
      "label": "MDD",
      "value": -18.3,
      "unit": "%",
      "semantic_color": "negative",
      "severity": "warn",
      "ref": { "metric": "mdd", "period": "2025-01-15~2026-04-30", "n": 320 }
    }
  ],
  "charts": [],
  "insights": [
    {
      "severity": "warn",
      "icon": "⚠️",
      "title": "포트폴리오 MDD 자산군 가중 임계 근접",
      "observation": "MDD -18.3%로 가중 임계 -17%를 초과",
      "implication": "현 추세 지속 시 자본 잠식 심화 가능",
      "recommended_action": "방어 자산 비중 5~10%p 상향 검토",
      "follow_up_metrics": ["mdd", "recovery_days", "cvar_95"],
      "ref": { "metric": "mdd", "period": "2025-01-15~2026-04-30", "n": 320 }
    }
  ],
  "raw_metrics": {
    "risk": {
      "mdd": -18.3, "recovery_days": null, "downside_dev": 0.12,
      "sortino": 0.85, "var_95": -2.4, "cvar_95": -3.7, "calmar": 0.41,
      "asset_class_thresholds": { "equity": "info", "etf": "warn", "crypto": "critical", "bond": "info" }
    },
    "sample_size": 320
  }
}
```

### 6.4.2 Standard 모드 (다자산)

**입력 CSV** (`examples/03_multi_asset.csv` 발췌):

| asset_id | asset_class | quantity | avg_cost | acquired_at |
|---|---|---|---|---|
| 005930.KS | equity | 50 | 72000 | 2025-03-12 |
| QQQ | etf | 10 | 480.50 | 2025-06-01 |
| BTC-USD | crypto | 0.05 | 65000 | 2025-09-20 |
| KR1Y_BOND | bond | 100 | 98.5 | 2025-01-15 |

**출력 (발췌)**:
```json
{
  "meta": {
    "skill_version": "3.0.0",
    "mode": "standard",
    "audience": "intermediate",
    "risk_profile": "moderate",
    "locale": "ko-KR",
    "cache_key": "abc123...",
    "warnings": ["BTC-USD 표본 < 60일, 통계 보통"]
  },
  "kpis": [
    { "id": "kpi_total_return", "label": "총 수익률", "value": 12.4, "unit": "%", "semantic_color": "positive", "ref": {} },
    { "id": "kpi_sharpe", "label": "샤프 비율", "value": 1.42, "unit": "score", "semantic_color": "positive", "ref": {} },
    { "id": "kpi_mdd", "label": "MDD", "value": -18.3, "unit": "%", "semantic_color": "negative", "severity": "warn", "ref": {} },
    { "id": "kpi_calmar", "label": "칼마 비율", "value": 0.41, "unit": "score", "semantic_color": "negative", "severity": "warn", "ref": {} },
    { "id": "kpi_cvar", "label": "CVaR 95%", "value": -3.7, "unit": "%", "semantic_color": "negative", "severity": "warn", "ref": {} }
  ],
  "insights": [
    {
      "severity": "warn",
      "icon": "🎯",
      "title": "BTC 자산군 집중 경고",
      "observation": "BTC-USD 비중 22%로 crypto 자산군 임계(15%) 초과",
      "implication": "암호자산 단일 노출이 전체 변동성 비대칭적 증폭",
      "recommended_action": "BTC 10% 트림 후 비상관 자산군 편입 검토",
      "follow_up_metrics": ["weight.BTC-USD", "correlation.BTC-USD~portfolio"],
      "ref": { "metric": "concentration", "period": "2026-04-30", "n": 1 }
    }
  ],
  "report": {
    "D": {
      "actions": [
        {
          "action": "trim",
          "asset_id": "BTC-USD",
          "target_weight": 0.10,
          "deadline": "2026-05-31",
          "rationale": "→ 02_metrics_skills.md §2.4.1 crypto 단일 자산 집중 임계 초과"
        }
      ],
      "monitoring": ["mdd", "concentration.crypto", "correlation_matrix", "recovery_days"]
    }
  }
}
```

### 6.4.3 검증 포인트

- `mode`·`audience` 명시 → 프론트 렌더 분기 + 톤 분기
- `RiskMetrics`에 VaR·CVaR·Calmar·recovery_days 동시 노출
- `Severity` enum 통일 (`info`·`warn`·`critical`)
- `tracking_error`·`sortino` 단일 정의 (중복 제거 검증)
- BTC 22%가 equity 임계 30% 미달이나 crypto 15% 초과 — 자산군별 차등 효과
- `KPI.semantic_color`는 값 방향성만, `severity`는 별도 차원 — 색상 매핑 단순화

---

> **명세 시스템 종료점**. 본 출력 계약을 따르는 JSON은 React/Vue 프론트엔드가 그대로 받아 렌더링할 수 있어야 한다.
