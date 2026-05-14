# Omni-Dash 문서 리뷰 & 보완 계획 (v1.1 — skills_v0.md 마감 대비)

> **리뷰 대상**: `docs/skills/skills_v0.md` (집중) / `README.md` (후속) / `docs/plan/기획서.md` (참조 — **제출 완료, 잠금**)
> **기준 문서**: `docs/notice/개요.md` (해커톤 공식 사양 / 평가 기준)
> **리뷰 일자**: 2026-05-06
> **마감**: `skills_v0.md` D-1 (제출일 2026-05-07)
> **이전 버전**: v1 (2026-05-05) — 3개 문서 균형 평가 / 본 v1.1은 **잠금된 기획서를 전제로 명세를 보완하는 관점**으로 전면 재구성

---

## 0. 컨텍스트 변경 사항 (v1 → v1.1)

| 변경 | 이전(v1) | 현재(v1.1) |
|---|---|---|
| 기획서 상태 | 수정 가능 | **제출 완료 / 변경 불가** |
| 핵심 작업 대상 | 3개 문서 균등 | **`skills_v0.md` 우선** (마감 D-1) |
| 정합성 갭 처리 | 양쪽에서 메우기 | **명세 쪽에서 단방향 회수** (기획서가 약속한 것을 명세에 반드시 반영) |
| README | 동등 비중 | 시간 남으면 후속 |

> **핵심 함의**: 기획서가 차별화 포인트로 내건 약속(Quick/Standard/Full 3단 모드, 자산군별 임계값 차등, Progressive Disclosure)을 **명세에서 반드시 회수**해야 한다. 이를 빼면 심사위원이 "기획서엔 있고 명세엔 없다"는 정합성 누수를 즉시 적발한다.

---

## 1. skills_v0.md 현재 점수 — 86/100 (v1과 동일)

| 항목 | 점수 | 코멘트 |
|---|---:|---|
| 명세 완결성 (9개 섹션) | 10/10 | 파이프라인→정규화→시맨틱→시각화→BUILD→NLG→출력→가드레일→트리거→예시. 누락 없음. |
| 시맨틱 레이어 (지표 단일 정의) | 10/10 | 단순/로그/누적/CAGR 사용 조건 분리, R²<0.5 베타 유보 등 통계 가드레일이 견고. |
| 시각화 선택 매트릭스 | 9/10 | 분석 목적 × 데이터 형태 매핑 표 우수. 라이브러리(Plotly/Recharts/D3) 매핑은 부재. |
| 출력 계약(JSON Interface) | 9/10 | TypeScript interface 명시. ChartSpec / Insight / KPI / Attribution 등 하위 타입 정의 누락. |
| 자동 경고 트리거 규칙 | 10/10 | MDD <-20%, 샤프≥2.0 등 임계값과 자동 코멘트가 짝지어져 있어 즉시 구현 가능. |
| 가드레일·금지 사항 | 9/10 | 환각 방지·단정 금지·무한대 표시 금지 등 운영 위험 차단. |
| 기획서와의 정합성 | 6/10 | **Quick/Standard/Full 3단 모드 / 자산군별 임계값 차등 / references/ 분리**가 명세에 반영되지 않음 — 본 v1.1의 최우선 보완 대상. |
| 입력 예시·샘플 데이터 | 5/10 | "Quick Start" 텍스트만 있음. 실제 CSV/JSON 샘플과 그에 대응하는 출력 예시 부재. |
| 버전 관리·CHANGELOG | 6/10 | §7.3에 SemVer 정책은 명시. 그러나 v1.0.0 단일이고 `CHANGELOG.md` 미존재. |
| 가독성·구조 | 9/10 | 표·코드블록 비율 적절. 약 400라인 자체 목표(기획서 4장)에 부합. |
| 부분합 | 83/100 | |
| 가산점 (트리거 키워드 사전) | +3 | 한/영 트리거 키워드 분리. LLM 호출 측면에서 실용적. |
| **총점** | **86/100** | |

---

## 2. 평가 기준(개요.md §2차) × skills_v0.md 답변 매핑

| 평가 항목 (배점) | 명세 현재 답변 위치 | 갭 | 보완 우선순위 |
|---|---|---|---|
| 범용성 (25) | §1 정규화 / §1.1 표준 스키마 | **자산군별 차등 임계값 부재** — equity·etf·bond·crypto가 동일 임계로 평가됨 | **P0** |
| Skills.md 설계 (25) | §2 시맨틱 / §3 시각화 / §4 BUILD / §7 가드레일 | 가장 강함. ChartSpec 하위 타입 누락만 보강 | P1 |
| 대시보드 자동 생성 (25) | §6 출력 계약 (TS interface) | **샘플 입력→출력 1세트 부재**, 라이브러리 매핑 부재 | **P0** |
| 바이브코딩 활용 (15) | §0 파이프라인 / §8 트리거 / §9 Quick Start | "이대로 컴파일하면 끝"이라는 인상이 약함. 라이브러리 매핑 부록이 결정타 | P1 |
| 실용성·창의성 (10) | — | **Quick/Standard/Full 3단 모드 누락** = 기획서에서 약속한 차별화가 명세에 없음 | **P0** |

> **결론**: P0 3건(자산군별 임계값 / 샘플 입출력 / Quick·Standard·Full)을 마감 전 반드시 회수.

---

## 3. D-1 보완 명세 (그대로 명세에 추가할 수 있는 형태)

> 아래 §3.1~§3.7은 `skills_v0.md`에 **추가/수정할 섹션의 초안**이다. 작업자는 본 섹션을 복사해 명세에 이식하고 톤을 다듬으면 된다.

### 3.1 Quick / Standard / Full 3단 출력 모드 (P0 — 기획서 약속 회수)

`skills_v0.md` **§4 BUILD 섹션 앞** 또는 **§0과 §1 사이**에 신설.

```markdown
## 0.5 출력 모드 (Output Modes)

본 스킬은 사용자 질의 유형에 따라 3단계 출력 강도를 자동 선택한다.

| 모드 | 트리거 조건 | 응답 시간 목표 | 출력 범위 | 비고 |
|---|---|---|---|---|
| Quick | 단일 지표 질의 ("MDD만", "샤프 비율은?") / 토큰 < 30 | < 1.5s | §2 시맨틱 레이어의 해당 지표 + §5.2 임계값 트리거 코멘트 1줄 | §3 차트, §4 BUILD 생략 |
| Standard | 일반 분석 요청 ("내 포트폴리오 분석") / 토큰 30~100 | < 5s | §2 핵심 지표 5개 + §3 차트 3~4개 + §4 BUILD 5단 요약 | 기본값 |
| Full | 명시적 풀 리포트 요청 ("심층 분석", "리포트 PDF") / 다자산 비교 | < 15s | §2 전체 지표 + §3 차트 6~8개 + §4 BUILD 5단 + §5 모든 인사이트 + §6 출력 계약 전체 | 1차 평가 데모용 |

**모드 자동 결정 로직**
1. 사용자 입력에서 §8 트리거 키워드 매칭
2. 질의 토큰 길이 + 지표 언급 개수 기반 분기
3. 명시적 모드 지시("간단히", "자세히")가 있으면 우선
4. 기본값은 **Standard**

**Quick → Standard 승격 조건**: Quick 응답에서 §5.2 임계값 트리거가 발동되면 자동으로 Standard로 승격하고 사용자에게 "추가 분석을 표시할까요?" 확인.
```

### 3.2 자산군별 차등 임계값 표 (P0 — 기획서 약속 회수, 범용성 25점 직접 영향)

`skills_v0.md` **§2.4 기본 파라미터 바로 아래** 또는 **§2.5 가드레일 직전**에 신설.

```markdown
### 2.4.1 자산군별 임계값 차등 (Asset-Class-Specific Thresholds)

지표 임계값은 자산군의 통계적 특성에 따라 다르게 해석한다. 단일 임계값을 모든 자산에 적용하면 채권의 위험을 과대평가하고 암호자산의 위험을 과소평가한다.

| 임계값 | equity | etf | bond | crypto | commodity | 해석 가이드 |
|---|---|---|---|---|---|---|
| 연환산 변동성 σ "정상" | 15~25% | 10~20% | 3~8% | 60~120% | 20~35% | 범위 초과 시 §5.2 경고 |
| MDD "주의" 임계 | -20% | -15% | -10% | -50% | -30% | 임계 초과 시 자본 잠식 경고 자동 삽입 |
| 베타 "고변동" 기준 (시장 대비) | β > 1.3 | β > 1.2 | β > 0.5 | β > 1.5 | β > 1.2 | 자산군 시장 베타 기준 |
| 샤프 비율 "양호" | ≥ 1.0 | ≥ 0.8 | ≥ 0.4 | ≥ 1.5 | ≥ 0.6 | 자산군별 무위험 대비 |
| 단일 자산 집중 경고 | > 30% | > 40% | > 50% | > 15% | > 20% | 분산 원칙 권고 |

**적용 규칙**
- 포트폴리오에 다중 자산군이 혼재할 경우, **가중평균 임계**를 사용한다: `threshold_portfolio = Σ(weight_i × threshold_class_i)`
- 자산군 분류가 불명확한 경우(예: 멀티에셋 펀드), 가장 보수적인 임계(가장 낮은 변동성 허용치)를 적용하고 `warnings`에 명시.
- 본 표의 수치는 권고치이며, 사용자가 `risk_profile: aggressive | moderate | conservative` 파라미터로 ±20% 조정 가능.
```

### 3.3 ChartSpec / Insight / KPI 하위 타입 정의 (P0 — 출력 계약 컴파일 가능성)

`skills_v0.md` **§6 출력 계약** 내부에 추가. 현재 TS interface는 최상위만 정의되어 있어 프론트가 구현할 수 없다.

```markdown
### 6.1 하위 타입 정의 (Subtypes)

```typescript
interface KPI {
  id: string;
  label: string;             // "총 수익률", "샤프 비율"
  value: number;
  unit: "%" | "x" | "currency" | "score";
  change?: number;           // 직전 기간 대비 변동
  semantic_color: "positive" | "negative" | "neutral" | "warning" | "critical";
  ref: { metric: string; period: string; n: number };
}

interface ChartSpec {
  id: string;
  type:
    | "candlestick" | "line" | "multi_line" | "small_multiples"
    | "heatmap" | "donut" | "treemap" | "waterfall"
    | "horizontal_bar" | "histogram_box" | "bubble"
    | "big_number_sparkline" | "underwater";
  title: string;
  data: { x: any[]; y: any[]; series?: string[] };  // 차트 타입별 확장
  encoding: {
    x_axis?: { label: string; type: "time" | "category" | "linear" };
    y_axis?: { label: string; type: "linear" | "log"; zero_baseline: boolean };
    color_map?: Record<string, string>;             // §3.2 시맨틱 컬러
  };
  annotations?: { x: any; y: number; text: string }[];
  source: string;            // "Yahoo Finance / 2026-04-30 종가"
  caveat?: string;            // "표본 < 30, 통계적 유의성 낮음"
}

interface Attribution {
  asset_id: string;
  asset_name: string;
  contribution_pct: number;  // 포트폴리오 기여도 (양수=상승 기여)
  weight: number;
  return_pct: number;
}

interface RiskMetrics {
  mdd: number;
  downside_dev: number;
  sortino: number;
  var_95: number;
  asset_class_thresholds: Record<string, "ok" | "warn" | "critical">;
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
  deadline?: string;          // ISO-8601
  rationale: string;
}

interface Insight {
  severity: "info" | "warn" | "critical";
  icon: string;               // "⚠️" | "⚡" | "🔻" | "🎯" | "🔗" | "📈"
  title: string;
  observation: string;        // "무엇이 발견되었나"
  implication: string;        // "왜 중요한가"
  recommended_action: string;
  follow_up_metrics: string[];
  ref: { metric: string; period: string; n: number };
}

interface SemanticMetrics {
  returns: { simple: number; log: number; cumulative: number; cagr: number };
  risk: RiskMetrics;
  risk_adjusted: { sharpe: number; sortino: number; treynor: number; info_ratio: number; alpha: number; beta: number; r_squared: number };
  benchmark: { id: string; performance: number; tracking_error: number };
  sample_size: number;
}

interface BenchmarkComparison {
  benchmark_id: string;
  absolute_return: number;
  relative_return: number;
  attribution: Attribution[];
}
```

본 하위 타입은 §6 최상위 `DashboardOutput`의 모든 필드를 컴파일 가능하게 만든다.
```

### 3.4 샘플 입력 → 출력 1세트 (P0 — 범용성·자동 생성 25점 + 25점 = 50점에 직접 영향)

`skills_v0.md` **§9 사용 예시 바로 아래** 또는 별도 부록 섹션으로.

작성 권장 형태:
- `examples/portfolio_sample.csv` (15행 정도, 국내 주식 + 해외 ETF + 채권 혼재)
- `examples/portfolio_sample.output.json` (위 입력에 대한 `DashboardOutput` 인스턴스)
- 명세 본문에는 **요약된 입출력만** 인라인하고 실제 파일은 `examples/` 디렉토리로 분리.

```markdown
### 9.1 샘플 입력 → 출력 (E2E 예시)

**입력** (`examples/portfolio_sample.csv` 발췌)
| asset_id | asset_class | quantity | avg_cost | acquired_at |
|---|---|---|---|---|
| 005930.KS | equity | 50 | 72000 | 2025-03-12 |
| QQQ | etf | 10 | 480.50 | 2025-06-01 |
| BTC-USD | crypto | 0.05 | 65000 | 2025-09-20 |
| KR1Y_BOND | bond | 100 | 98.5 | 2025-01-15 |

**출력 요약** (`examples/portfolio_sample.output.json` 발췌)
- KPI: `{ 총수익률: +12.4%, 샤프: 1.42, MDD: -18.3% }`
- Insight: `⚠️ "BTC 비중 22%로 자산군 임계(15%) 초과"` (§2.4.1 적용)
- BUILD-D 액션: `{ action: "trim", asset_id: "BTC-USD", target_weight: 0.10 }`

전체 페이로드는 `examples/portfolio_sample.output.json` 참조.
```

### 3.5 라이브러리 매핑 부록 (P1 — 바이브코딩 15점)

`skills_v0.md` **§3.4** 또는 부록으로.

```markdown
### 3.4 차트 타입 → 추천 라이브러리 매핑

| ChartSpec.type | 1순위 | 2순위 | 비고 |
|---|---|---|---|
| candlestick | Plotly (`Candlestick`) | Recharts custom | 거래량 보조축 내장 |
| line / multi_line | Recharts (`LineChart`) | Plotly | 인터랙션 가벼움 |
| small_multiples | D3 + Recharts grid | Plotly subplot | 8개 이상 시계열 |
| heatmap | Plotly (`Heatmap`) | D3 | 발산형 컬러스케일 직접 매핑 |
| donut | Recharts (`PieChart` + innerRadius) | Plotly | 5개 이하 자산 |
| treemap | Recharts (`Treemap`) | D3 | 면적=비중, 색상=수익률 |
| waterfall | Plotly (`Waterfall`) | Recharts custom | 양/음/합계 색상 분리 |
| underwater | Recharts area + 0 baseline | Plotly | MDD 추적 |
| big_number_sparkline | 자체 컴포넌트 + Recharts mini line | — | KPI 패널 |

**선택 원칙**: Recharts는 React 친화·번들 사이즈 작음 / Plotly는 통계·금융 전용 차트 풍부. 본 프로젝트 기본은 **Recharts**, 캔들스틱·히트맵·워터폴은 Plotly.
```

### 3.6 references/ 디렉토리 분리 (P1 — Progressive Disclosure 약속 회수)

기획서 §2.1이 "자주 쓰는 규칙만 본문, 자산군별 임계값/예시는 references/로 분리"를 명시했음. 다음 분리를 제안:

```
docs/skills/
├── skills_v0.md                          # 본문 (현재 약 400라인 유지)
└── references/
    ├── asset_class_thresholds.md         # §2.4.1 자산군별 임계값 상세
    ├── chart_library_mapping.md          # §3.4 라이브러리 매핑 상세
    ├── output_contract_subtypes.md       # §6.1 하위 타입 풀 정의
    ├── examples/
    │   ├── portfolio_sample.csv
    │   └── portfolio_sample.output.json
    └── changelog.md                       # SemVer 변경 이력
```

본문에는 각 항목 요약만 두고 `→ references/...md` 링크로 연결.

### 3.7 CHANGELOG.md 신설 (P1)

`docs/skills/CHANGELOG.md` 또는 `docs/skills/references/changelog.md` 작성.

```markdown
# Skills.md Changelog

본 문서는 `skills_v0.md`의 변경 이력을 SemVer 규칙(§7.3)에 따라 기록한다.

## [1.1.0] - 2026-05-07
### Added
- §0.5 Quick/Standard/Full 3단 출력 모드
- §2.4.1 자산군별 차등 임계값 표 (equity/etf/bond/crypto/commodity)
- §3.4 차트 타입 → 라이브러리 매핑 부록
- §6.1 ChartSpec / Insight / KPI 등 하위 타입 정의
- §9.1 샘플 입력 → 출력 E2E 예시 (`examples/portfolio_sample.*`)

### Changed
- 본문 구조: Progressive Disclosure 적용, 상세 항목을 `references/`로 분리

## [1.0.0] - 2026-05-05
### Initial
- 9개 섹션 기본 명세 (파이프라인 → 정규화 → 시맨틱 → 시각화 → BUILD → NLG → 출력 → 가드레일 → 트리거)
```

---

## 4. D-1 작업 타임박스 (마감 2026-05-07)

> 시간 예산 8시간을 가정한 권장 순서. P0 3건이 5시간 이내에 끝나는 게 안전.

| # | 작업 | 예상 시간 | 영향도 (점수) | 비고 |
|---|---|---|---|---|
| 1 | §3.2 자산군별 임계값 표 추가 | 60분 | 범용성 +3~5점 | 기존 §2.4 바로 아래 |
| 2 | §3.1 Quick/Standard/Full 모드 신설 | 60분 | 실용·창의성 +3~5점 | §0과 §1 사이 |
| 3 | §3.3 ChartSpec/Insight 하위 타입 | 90분 | 자동 생성 +3~5점 | §6 내부 확장 |
| 4 | §3.4 샘플 입력 CSV + 출력 JSON 작성 | 120분 | 범용성+자동 생성 +5~8점 | `examples/` 신설 |
| 5 | §3.5 라이브러리 매핑 부록 | 30분 | 바이브코딩 +2~3점 | §3 끝에 추가 |
| 6 | CHANGELOG.md 작성 + 버전 1.1.0 승급 | 20분 | 운영 신뢰도 | 프론트매터 `version: 1.1.0` |
| 7 | §3.6 references/ 분리 (선택) | 60분 | 가독성 | 시간 남으면 |
| 8 | 본문 명칭/경로 정합성 점검 (`Skills.md` → `skills_v0.md`) | 15분 | 정합성 | grep으로 일괄 |
| **합계** | | **약 7시간 35분** | | 1번~6번까지가 우선, 7~8은 여유분 |

**권장 순서**: 1 → 2 → 5 → 6 → 3 → 4 → 8 → 7
(가벼운 표 작업으로 워밍업 후 무거운 타입 정의·샘플 작성으로 진입, 마지막에 정리)

---

## 5. README.md (시간 남으면 — 마감 후 후속)

기획서가 잠금이라 README도 정합성 회수 차원에서 손볼 필요가 있다. 우선순위순:

1. **Project Structure를 실재로 교체** (5분) — `Skills.md`(루트), `src/`, `data/` → 실제 `docs/{notice,plan,skills}/` 구조로
2. **`skills_v0.md` 명칭·경로 통일** (5분) — README의 `Skills.md` 표기를 `docs/skills/skills_v0.md`로
3. **배포 URL 자리·스크린샷 추가** (배포 완료 후) — 1차 평가(투표 60%) 직격
4. **Getting Started 섹션** (배포 후) — 빌드/실행 명령
5. **License 뱃지 + LICENSE 파일** (10분) — Apache-2.0이면 정식 파일 추가

> **현재 README 점수 63/100** → 1·2·5만 반영해도 **75점대** 회복.

---

## 6. 기획서 정합성 (참조용 — 변경 불가, 명세에 단방향 회수)

기획서가 약속한 항목 vs `skills_v0.md` v1.0.0 반영 여부 + v1.1.0 회수 계획:

| 기획서 약속 (위치) | v1.0.0 반영 | v1.1.0 회수 계획 |
|---|---|---|
| Decoupling (§2.1) | ✅ | 유지 |
| Single Source of Truth (§2.1) | ✅ | 유지 |
| **Progressive Disclosure (§2.1)** | ❌ | §3.6 references/ 분리로 회수 |
| Guardrails First (§2.1) | ✅ | 유지 |
| **Quick/Standard/Full 3단 모드 (§2.2)** | ❌ | §3.1로 회수 |
| **자산군별 임계값 차등 (§2.2)** | ❌ | §3.2로 회수 |
| `[ref: metric=, period=, n=]` 추적성 (§2.2) | ✅ (§5.1) | 유지 |
| 조건부 진술만 허용 (§2.2) | ✅ (§5.1) | 유지 |
| 4가지 핵심 기능 (§3) | ✅ | 유지 |
| 약 400라인 룰셋 (§4) | ✅ | references/ 분리 후에도 본문 400라인 유지 |
| 3-Step 리포트 모드 (§4) | △ (§4 BUILD만) | §3.1 Quick/Standard/Full로 통합 정렬 |

→ **v1.1.0 적용 시 기획서 정합성 100% 회복**.

---

## 7. 채점 방법론 (재현성 노트)

- 각 문서 10개 항목 × 10점 = 100점 만점이 기본. 가산점은 해당 문서의 **고유 강점**(브랜딩, 사상적 일관성 등)에 한해 부여.
- 점수는 해커톤 2차 평가 항목(범용성/Skills 설계/대시보드 자동 생성/바이브코딩/실용·창의성)을 문서 평가 관점으로 재해석한 것이며, 실제 심사 점수와 1:1 대응되지 않음.
- v1 (2026-05-05): 3개 문서 균형 평가. v1.1 (2026-05-06): 기획서 제출 완료에 따라 명세 보완 중심으로 재구성.
- v1.1.0 명세 적용 후에는 v2 리뷰로 점수 재산정 권장. 예상 점수: **86 → 94~96**.

---

## 부록 A. 본 v1.1에서 다루지 않은 v1 내용 보존

v1에서 다뤘으나 본 v1.1에서 축약된 항목은 다음과 같다 (필요 시 git log로 v1 본문 참조):

- 기획서.md 단독 점수표 (72/100) — 기획서 잠금으로 보완 불가, 정합성 매핑(§6)만 유지
- README.md 단독 점수표 (63/100) — 핵심 행동만 §5에 남김
- 기획서 ↔ 개요.md 정합성 정밀 분석 — 기획서 잠금으로 작업 불가, 본 문서에서는 제외 (v1 부록 A 참조)

---

> **다음 액션**: §4 타임박스의 1~6번을 순서대로 처리. 작업이 끝나면 본 문서를 `document_review_v2.md`로 갱신하여 점수 재산정.
