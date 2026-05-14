---
name: financial-dashboard-generator
description: 투자 포트폴리오 데이터를 입력받아 수익률·위험 지표를 계산하고, 데이터 특성에 맞는 차트를 자동 매핑하며, BUILD 프레임워크 기반의 인사이트 코멘터리까지 일괄 생성하는 통합 룰셋. 사용자가 "포트폴리오 분석", "수익률 시각화", "투자 대시보드 생성", "리스크 브리핑", "섹터별 동향 비교", "성과 리포트", "ETF·펀드 분석" 등을 요청할 때 즉시 트리거하여 데이터 정규화 → 지표 계산 → 시각화 매핑 → 스토리텔링 → 인사이트 생성의 5단계 파이프라인을 가동한다. 질의 강도에 따라 Quick/Standard/Full 3단 출력 모드를 자동 선택한다.
version: 1.1.0
license: Apache-2.0
compatibility: Web frontend (React/Vue/HTML), Plotly/Recharts/D3 차트 라이브러리 호환, JSON/CSV/XBRL 입력 지원
---

# 금융 투자 대시보드 자동 생성 명세서 (skills_v1.md)

> **목적**: 투자 분석의 암묵지를 기계 가독형 선언적 명세로 추상화하여, 어떤 형태의 투자 데이터가 들어오든 일관된 대시보드와 인사이트를 자동 생성한다.
>
> **설계 원칙**: 규칙(What) ↔ 구현(How)의 완전한 분리(Decoupling). 본 문서는 "무엇을 분석하고 어떻게 보여줄지"만 정의하며, 구체적 코드 구현은 AI 코딩 에이전트가 본 명세를 컴파일하여 생성한다.
>
> **v1.1.0 변경점**: 출력 모드(§0.5), 자산군별 차등 임계값(§2.4.1), 출력 계약 하위 타입(§6.1), 차트→라이브러리 매핑(§3.4), E2E 샘플 입출력(§9.1) 추가. 자세한 이력은 §10 CHANGELOG.

---

## 0. 파이프라인 실행 순서 (Pipeline Order)

본 스킬이 트리거되면 **반드시 아래 순서대로** 실행해야 한다. 각 단계는 이전 단계의 출력을 입력으로 받는다.

```
[0.5] 출력 모드 결정  →  [1] 데이터 스키마 정규화  →  [2] 지표 계산 (시맨틱 레이어)
                                                       ↓
[5] NLG 인사이트 생성  ←  [4] BUILD 리포트 구성  ←  [3] 시각화 선택·렌더링
```

각 단계의 출력은 다음 형식의 JSON 페이로드로 다음 단계에 전달한다:
```json
{ "stage": 1, "mode": "standard", "normalized_data": {...}, "warnings": [], "next_stage": 2 }
```

---

## 0.5 출력 모드 (Output Modes)

본 스킬은 사용자 질의 유형에 따라 3단계 출력 강도를 자동 선택한다. 단순 질의에 풀 파이프라인을 강제하면 응답 지연·비용 낭비·UX 저하가 발생하므로, 질의 폭에 비례한 출력 깊이를 원칙으로 한다.

| 모드 | 트리거 조건 | 응답 시간 목표 | 출력 범위 | 비고 |
|---|---|---|---|---|
| **Quick** | 단일 지표 질의 ("MDD만", "샤프 비율은?") / 입력 토큰 < 30 | < 1.5s | §2 시맨틱 레이어의 해당 지표 + §5.2 임계값 트리거 코멘트 1줄 | §3 차트, §4 BUILD 생략 |
| **Standard** | 일반 분석 요청 ("내 포트폴리오 분석") / 입력 토큰 30~100 | < 5s | §2 핵심 지표 5개 + §3 차트 3~4개 + §4 BUILD 5단 요약 | **기본값** |
| **Full** | 명시적 풀 리포트 요청 ("심층 분석", "리포트 PDF") / 다자산 비교 / 다기간 비교 | < 15s | §2 전체 지표 + §3 차트 6~8개 + §4 BUILD 5단 + §5 모든 인사이트 + §6 출력 계약 전체 | 1차 평가 데모용 |

### 0.5.1 모드 자동 결정 로직

1. 사용자 입력에서 §8 트리거 키워드 매칭
2. 질의 토큰 길이 + 지표 언급 개수 기반 분기
3. 명시적 모드 지시("간단히", "자세히", "리포트")가 있으면 우선 적용
4. 기본값은 **Standard**

### 0.5.2 모드 승격 규칙

- **Quick → Standard 자동 승격**: Quick 응답 중 §5.2 임계값 트리거가 발동되면 Standard로 자동 승격하고, 사용자에게 "추가 분석을 표시할까요?" 확인 요청.
- **Standard → Full 수동 승격**: 사용자가 "더 자세히" 또는 "리포트로" 지시하면 Full 재실행. 기존 결과는 캐시 유지.

### 0.5.3 출력 계약과의 관계

`DashboardOutput.meta.mode` 필드에 적용 모드를 명시한다. 모드별 필수/선택 필드는 §6.2 참조.

---

## 1. 데이터 스키마 정규화 규칙 (Data Schema Normalization)

### 1.1 표준 입력 스키마 (Canonical Schema)

모든 입력 데이터는 다음 표준 스키마로 변환한다. 입력 형태(CSV, JSON, XBRL, FIX 등)와 무관하게 이 스키마를 강제한다.

```yaml
asset:
  asset_id: string          # 고유 식별자 (예: "AAPL", "005930.KS")
  asset_name: string        # 표시명
  asset_class: enum         # [equity, etf, fund, bond, crypto, commodity]
  sector: string            # GICS 11개 섹터 분류 또는 N/A
  base_currency: string     # ISO-4217 (USD, KRW, EUR 등)

timeseries:
  timestamp: string         # ISO-8601, 나노초까지 보존 (예: "2026-04-29T14:30:00.123456789Z")
  asset_id: string
  open: number
  high: number
  low: number
  close: number             # 필수, 종가 기준 가격
  volume: number | null
  adjusted_close: number    # 배당·분할 조정 종가, 수익률 계산 시 우선 사용

portfolio:
  position_id: string
  asset_id: string
  quantity: number
  avg_cost: number          # 평단가 (base_currency 기준)
  weight: number            # 0.0 ~ 1.0, 합계는 1.0 ± 0.001
  acquired_at: string       # ISO-8601
```

### 1.2 정규화 강제 규칙

- **타임스탬프**: 모든 시계열의 timestamp는 ISO-8601 UTC로 강제 변환. 나노초 정밀도를 보존하며, 잘라내기(truncation) 금지. 타임존 정보가 없는 입력은 거부하고 명시적 타임존 보강 요청.
- **통화 정규화**: 다중 통화 자산이 혼재할 경우, 사용자가 지정한 `base_currency`(기본값 USD)로 환율 데이터를 결합하여 일괄 환산. 환율 결합 일자는 각 거래의 `timestamp` 기준 당일 종가 환율을 사용.
- **결측치 처리**:
  - 가격 결측 → 직전 영업일 종가로 forward-fill (최대 3영업일까지만 허용)
  - 거래량 결측 → null 유지, 분석에서 제외 표시
  - 4영업일 이상 연속 결측 → 해당 자산을 분석에서 제외하고 `warnings` 배열에 기록
- **이상치 탐지**: 일일 수익률이 ±50%를 초과하는 데이터 포인트는 분할·합병 의심 플래그를 부여하고 `adjusted_close`로 재검증. 검증 실패 시 사용자에게 확인 요청.
- **XBRL 확장 항목**: 재무제표 입력 시 GAAP/IFRS 표준 분류 외 확장 개념(extension concepts)은 가장 가까운 표준 핵심 개념으로 매핑하고, 매핑 신뢰도(confidence score)를 0.0~1.0으로 부여.

### 1.3 검증 게이트 (Validation Gate)

다음 검증을 모두 통과해야 다음 단계로 진행한다:

- [ ] 모든 필수 필드(`asset_id`, `timestamp`, `close`)가 null이 아님
- [ ] `weight` 합계가 1.0 ± 0.001 범위 내
- [ ] `timestamp`가 단조 증가(strictly monotonic)
- [ ] `base_currency`가 ISO-4217 유효 코드

검증 실패 시 처리를 중단하고 구체적 위반 항목을 사용자에게 반환한다.

---

## 2. 지표 계산 규칙 (Metric Calculation - Semantic Layer)

### 2.1 시맨틱 레이어 원칙

본 섹션의 모든 지표는 **단일 진실의 원천(Single Source of Truth)** 으로 작용한다. 어떤 차트, 어떤 인사이트도 본 섹션에 정의되지 않은 방식으로 지표를 재계산해서는 안 된다. 지표 정의가 변경될 때는 반드시 본 섹션을 수정하고 version을 올린다.

### 2.2 수익률 지표 (Return Metrics)

| 지표 | 수식 | 적용 조건 | 주의사항 |
|---|---|---|---|
| **단순 수익률** (Simple Return) | `R_t = (P_t - P_{t-1}) / P_{t-1}` | 횡단면 포트폴리오 가중 합산 시 사용 | 시계열 누적 합산 금지 (왜곡 발생) |
| **로그 수익률** (Log Return) | `r_t = ln(P_t / P_{t-1})` | 시계열 누적·복리 효과 분석 시 **기본값** | 횡단면 가중 합산 금지 (비선형성) |
| **누적 수익률** (Cumulative Return) | `Π(1 + R_t) - 1` (단순 기반) 또는 `Σr_t` (로그 기반) | 기간 전체 성과 측정 | 두 방식 혼용 절대 금지 |
| **CAGR** (연평균 복리) | `(P_end / P_start)^(1/years) - 1` | 1년 이상 장기 성과의 연환산 | 산술평균으로 대체하면 과대추정 |

**기본값 정책**: 분석 기간이 1일 이상인 시계열은 **로그 수익률을 기본**으로 계산한다. 포트폴리오 단위 일별 수익률은 **단순 수익률**로 계산하고, 이후 누적할 때만 로그로 변환한다.

### 2.3 위험 조정 성과 지표 (Risk-Adjusted Metrics)

| 지표 | 수식 | 측정 대상 | 임계값 해석 |
|---|---|---|---|
| **표준편차** (Volatility) | `σ = √(Σ(r_t - r̄)² / (n-1))` (연환산: × √252) | 총 변동성 | §2.4.1 자산군별 차등 적용 |
| **하방편차** (Downside Deviation) | `√(Σmin(r_t - MAR, 0)² / n)` | 하방 위험만 격리 | MAR 기본값: 무위험 수익률 |
| **샤프 비율** (Sharpe) | `(Rp - Rf) / σp` | 총 위험당 초과수익 | <0: 무위험 열위 / 1.0~1.99: 양호 / ≥2.0: 매우 우수(레버리지 점검) |
| **소르티노 비율** (Sortino) | `(Rp - Rf) / 하방편차` | 하방 위험당 초과수익 | 방어적 운용·헷지펀드 평가 시 우선 |
| **트레이너 비율** (Treynor) | `(Rp - Rf) / β` | 체계적 위험당 초과수익 | β < 0.1인 시장 중립 펀드는 N/A 처리 |
| **정보 비율** (Information Ratio) | `Active Return / Tracking Error` | 벤치마크 대비 액티브 운용 효율 | 액티브 펀드 매니저 평가 |
| **알파** (Alpha, Jensen) | `Rp - [Rf + β(Rm - Rf)]` | 매니저의 부가가치 | 양수면 초과 수익 창출 |
| **베타** (Beta) | `Cov(Rp, Rm) / Var(Rm)` | 시장 민감도 | §2.4.1 자산군별 차등 적용 |
| **MDD** (Max Drawdown) | `min((P_t - 누적최고가) / 누적최고가)` | 최대 낙폭 | §2.4.1 자산군별 차등 적용 |
| **R²** (결정계수) | `(상관계수)²` | 벤치마크 설명력 | 베타 신뢰도 검증, <0.7이면 베타 해석 주의 |

### 2.4 기본 파라미터

```yaml
risk_free_rate: 0.04        # 무위험 수익률 기본값 (4%, 사용자 오버라이드 가능)
trading_days_per_year: 252  # 연환산 기준
benchmark_default:
  US: SPY                   # S&P 500 ETF
  KR: KODEX 200             # 코스피 200 ETF
  Global: ACWI              # MSCI ACWI
mar_default: 0.04           # 최소 수용 수익률 (소르티노용)
risk_profile: moderate      # [conservative | moderate | aggressive], 임계값 ±20% 조정
```

### 2.4.1 자산군별 차등 임계값 (Asset-Class-Specific Thresholds)

지표 임계값은 자산군의 통계적 특성에 따라 다르게 해석한다. 단일 임계값을 모든 자산에 적용하면 채권의 위험을 과대평가하고 암호자산의 위험을 과소평가하므로, 자산군별 상대 프레임워크를 강제한다.

| 임계값 | equity | etf | bond | crypto | commodity | 해석 가이드 |
|---|---|---|---|---|---|---|
| **연환산 변동성 σ "정상"** | 15~25% | 10~20% | 3~8% | 60~120% | 20~35% | 범위 초과 시 §5.2 경고 |
| **MDD "주의" 임계** | -20% | -15% | -10% | -50% | -30% | 임계 초과 시 자본 잠식 경고 자동 삽입 |
| **베타 "고변동" 기준** (시장 대비) | β > 1.3 | β > 1.2 | β > 0.5 | β > 1.5 | β > 1.2 | 자산군 시장 베타 기준 |
| **샤프 비율 "양호"** | ≥ 1.0 | ≥ 0.8 | ≥ 0.4 | ≥ 1.5 | ≥ 0.6 | 자산군별 무위험 대비 |
| **단일 자산 집중 경고** | > 30% | > 40% | > 50% | > 15% | > 20% | 분산 원칙 권고 |

**적용 규칙**

- 포트폴리오에 다중 자산군이 혼재할 경우, **가중평균 임계**를 사용한다:
  `threshold_portfolio = Σ(weight_i × threshold_class_i)`
- 자산군 분류가 불명확한 경우(예: 멀티에셋 펀드), 가장 보수적인 임계(가장 낮은 변동성 허용치)를 적용하고 `warnings`에 명시.
- 본 표의 수치는 권고치이며, 사용자 `risk_profile` 파라미터로 ±20% 조정 가능:
  - `conservative`: 임계값 -20% (더 엄격)
  - `moderate`: 표준값 (기본)
  - `aggressive`: 임계값 +20% (더 관대)
- 자산군 임계 충족 여부는 §6.1 `RiskMetrics.asset_class_thresholds` 필드에 `ok | warn | critical`로 기록.

### 2.5 계산 가드레일

- 표본 수가 30 미만이면 모든 위험 지표에 "낮은 통계적 유의성" 플래그 부착
- β 계산 시 R² < 0.5이면 결과를 유보하고 사용자에게 벤치마크 적합성 재검토 요청
- 분모가 0에 수렴하는 지표(트레이너의 β, 샤프의 σ)는 자동으로 N/A 처리, 절대 무한대 표시 금지

---

## 3. 시각화 선택 및 레이아웃 규칙 (Visualization Selection)

### 3.1 차트 선택 의사결정 매트릭스

LLM/에이전트는 분석 목적과 데이터 특성을 입력받아 **아래 매트릭스에 따라 기계적으로 차트를 선택**한다. 미학적 선호로 매트릭스를 위반하지 않는다.

| 분석 목적 | 데이터 형태 | 선택 차트 | 핵심 인코딩 규칙 |
|---|---|---|---|
| 시계열 가격 추적 | 단일 자산, OHLC 보유 | **캔들스틱** | 상승=녹색, 하락=적색. 거래량은 하단 보조축. |
| 시계열 가격 추적 | 단일 자산, 종가만 | **라인 차트** | 단일 색상, 두께 2px |
| 다자산 시계열 비교 | 2~7개 자산 | **다중 라인 차트** | 시작값을 100으로 정규화(rebase) |
| 다자산 시계열 비교 | 8개 이상 | **소형 다중 차트** (Small Multiples) | 동일 y축 스케일 강제 |
| 자산 간 상관관계 | 상관계수 행렬 | **히트맵** | 발산형 컬러스케일(-1=청, 0=백, +1=적), \|r\|≥0.8 셀에 값 주석 |
| 포트폴리오 구성 | 5개 이하 자산 | **도넛 차트** | 비중 5% 미만은 "기타"로 통합 |
| 포트폴리오 구성 | 6개 이상 / 계층 구조 | **트리맵** | 면적=비중, 색상=수익률(발산형) |
| 손익 변화 동인 | 기초→기말 변동 분해 | **워터폴 차트** | 양수=녹색, 음수=적색, 합계=청색 |
| 단순 비교·랭킹 | 카테고리 ≤15개 | **수평 바 차트** | 값 기준 내림차순 정렬 |
| 분포·이상치 | 수익률 분포 | **히스토그램 + 박스플롯 오버레이** | 정규분포 곡선 보조 표시 |
| 위험-수익 산점 | 다자산 비교 | **버블 차트** | x=σ, y=수익률, 크기=AUM |
| 단일 KPI 강조 | 핵심 수치 1개 | **빅넘버 + 스파크라인** | 전기 대비 변동률을 색상으로 |
| MDD 추적 | 시계열 낙폭 | **언더워터 차트** | 0에서 음수로 채워진 영역 |

### 3.2 색상 거버넌스

대시보드 전체에서 색상의 의미는 **절대 일관성**을 유지한다.

```yaml
semantic_colors:
  positive: "#16A34A"   # 수익, 상승, 양호
  negative: "#DC2626"   # 손실, 하락, 경고
  neutral:  "#64748B"   # 변동 없음, 무관
  primary:  "#2563EB"   # 주 데이터, 포트폴리오
  benchmark: "#94A3B8"  # 벤치마크 (항상 회색조)
  warning:  "#F59E0B"   # 임계치 근접
  critical: "#991B1B"   # 임계치 초과
```

색맹 접근성을 위해 색상에만 의미를 부여하지 않고, 항상 아이콘이나 레이블을 보조 사용한다.

### 3.3 레이아웃 규칙 (Z-Layout 강제)

대시보드는 다음 그리드 구조를 따른다:

```
┌─────────────────────────────────────────────────────────┐
│ [1] KPI 요약 패널 (좌상단)  →  [2] 핵심 알림 (우상단)     │ ← Z-Layout 시작
├─────────────────────────────────────────────────────────┤
│ [3] 메인 시계열 차트 (전체 너비)                          │
├──────────────────────────┬──────────────────────────────┤
│ [4] 포트폴리오 구성       │ [5] 위험 지표 패널            │
├──────────────────────────┴──────────────────────────────┤
│ [6] 상세 테이블 / 드릴다운 (좌하단 → 우하단)              │ ← Z-Layout 종료
└─────────────────────────────────────────────────────────┘
```

- **상단 30%**: 핵심 KPI와 즉각적 행동 신호 (BLUF 원칙)
- **중단 40%**: 메인 분석 차트와 상세 분해
- **하단 30%**: 드릴다운 테이블, 보조 분석
- **한 화면 6~8개 차트 상한**: 점진적 공개(Progressive Disclosure)로 세부 정보는 클릭 시 노출
- **여백 우선**: 차트 간 구분은 24px 이상의 패딩으로, 격자선·진한 테두리 사용 금지
- **이중 축(dual-axis) 차트 금지**: 허위 상관관계를 암시. 분리된 차트 두 개로 대체.
- **절단된 축 금지**: 막대·영역 차트의 y축은 0부터 시작. 시계열 라인 차트는 예외 허용.

### 3.4 차트 타입 → 추천 라이브러리 매핑 (Library Mapping)

바이브 코딩 시 라이브러리 선택을 표준화하기 위한 매핑. 본 매핑은 권고이며, 동일 시각적 결과를 다른 라이브러리로 대체해도 명세 위반이 아니다.

| ChartSpec.type | 1순위 | 2순위 | 비고 |
|---|---|---|---|
| `candlestick` | Plotly (`Candlestick`) | Recharts custom | 거래량 보조축 내장 |
| `line` / `multi_line` | Recharts (`LineChart`) | Plotly | 인터랙션 가벼움 |
| `small_multiples` | D3 + Recharts grid | Plotly subplot | 8개 이상 시계열 |
| `heatmap` | Plotly (`Heatmap`) | D3 | 발산형 컬러스케일 직접 매핑 |
| `donut` | Recharts (`PieChart` + innerRadius) | Plotly | 5개 이하 자산 |
| `treemap` | Recharts (`Treemap`) | D3 | 면적=비중, 색상=수익률 |
| `waterfall` | Plotly (`Waterfall`) | Recharts custom | 양/음/합계 색상 분리 |
| `horizontal_bar` | Recharts (`BarChart` layout="vertical") | Plotly | 카테고리 정렬 |
| `histogram_box` | Plotly (`Histogram` + `Box`) | D3 | 정규분포 보조선 |
| `bubble` | Recharts (`ScatterChart`) | Plotly | 위험-수익 산점 |
| `big_number_sparkline` | 자체 컴포넌트 + Recharts mini line | — | KPI 패널 |
| `underwater` | Recharts area + 0 baseline | Plotly | MDD 추적 |

**선택 원칙**

- **기본 라이브러리는 Recharts** — React 친화·번들 사이즈 작음·SSR 호환.
- **Plotly로 전환하는 경우** — 캔들스틱·히트맵·워터폴·히스토그램 박스플롯 오버레이 등 통계·금융 전용 차트가 필요할 때.
- **D3로 전환하는 경우** — 소형 다중 차트, 트리맵 커스텀, 발산형 색상 보간 등 세밀한 제어가 필요할 때.
- 한 대시보드 내 라이브러리 혼용은 허용하나, 색상 토큰(§3.2)은 모든 라이브러리에서 동일하게 적용.

---

## 4. 리포트 구성 흐름 - BUILD 프레임워크 (Report Composition)

### 4.1 BUILD 프레임워크 강제 헤더 구조

모든 분석 리포트 출력은 **반드시 아래 5단계 마크다운 헤더 구조**를 따라야 한다. 단계를 생략하거나 순서를 바꾸지 않는다. (단, Quick 모드에서는 BUILD 전체를 생략하고 §2 지표만 반환 — §0.5 참조)

```markdown
### 📌 요약 (Begin with the End in Mind)
- BLUF: 핵심 결론 1~2문장과 즉각적으로 취해야 할 행동
- 핵심 KPI 3개 (수익률, 위험지표, 변동률)

### 🌐 거시 경제 맥락 (Understand the Context)
- 분석 기간 동안의 시장 환경 요약
- 벤치마크 대비 성과 (절대값 + 상대값)
- 외부 이벤트(금리, 환율, 거시지표)와의 연관성

### 💡 성과 동인 (Illustrate Insights)
- 긍정적 기여 상위 3개 자산 (기여도 %)
- 부정적 기여 상위 3개 자산 (기여도 %)
- 핵심 시각화 1개를 앵커로 배치

### ⚠️ 위험 지표 및 의미 (Link Data to Implications)
- 하방 위험 중심 분석 (MDD, 하방편차, 소르티노)
- "So What?" 해석: 발견된 리스크의 비즈니스적 함의
- 시나리오 분석 (낙관/기준/비관)

### ✅ 권고 사항 (Drive Action)
- 구체적 액션 아이템 (자산명·비중·시점 명시)
- 책임자·데드라인 (있는 경우)
- 모니터링해야 할 후속 지표
```

### 4.2 섹션별 데이터 플레이스홀더

각 섹션에 들어갈 데이터는 다음 플레이스홀더 변수로 채운다:

```yaml
B_section:
  - {bluf_statement}: "지난 분기 포트폴리오 수익률 X.X%, 벤치마크 대비 +/-X.X%p..."
  - {top_kpi_1}: { name, value, change, color }
  - {top_kpi_2}: { ... }
  - {top_kpi_3}: { ... }

U_section:
  - {market_regime}: "고금리·저변동성 / 저금리·고변동성 / ..."
  - {benchmark_performance}: { absolute, relative, attribution }

I_section:
  - {top_contributors}: [ {asset, contribution_pct}, ... ]
  - {top_detractors}: [ {asset, contribution_pct}, ... ]
  - {anchor_chart}: ChartSpec

L_section:
  - {risk_metrics}: { mdd, downside_dev, sortino, var_95 }
  - {scenario_analysis}: { optimistic, base, pessimistic }

D_section:
  - {action_items}: [ {action, asset, target_weight, deadline}, ... ]
  - {monitoring_kpis}: [ ... ]
```

---

## 5. 인사이트 자동 생성 규칙 (NLG / Insight Rules)

### 5.1 인사이트 생성 원칙

- **숫자 나열 금지**: "수익률 5%"가 아니라 "벤치마크 대비 2%p 초과 성과로, 종목 선택이 시장 타이밍보다 효과적이었음"
- **인과 관계 명시**: 모든 변동에는 "원인(What drove)" → "결과(So what)" → "함의(Now what)" 3단 구조
- **근거 추적성**: 각 인사이트 문장 끝에 참조한 지표·기간·표본수를 `[ref: metric=sharpe, period=2026Q1, n=63]` 형식으로 부착
- **환각 방지**: 시맨틱 레이어(섹션 2)에 정의되지 않은 지표는 절대 생성·언급하지 않음
- **편향 회피**: 추측성 시장 전망("주가가 오를 것이다") 금지. 대신 "조건 X가 유지되면 Y 시나리오의 확률이 높아짐" 형태로 조건부 진술.

### 5.2 임계값 기반 자동 경고 트리거

다음 조건을 충족하면 **자동으로 해당 코멘트를 리포트에 삽입**한다. 임계값은 §2.4.1 자산군별 차등을 우선 적용한다.

| 트리거 조건 | 자동 생성 인사이트 |
|---|---|
| MDD가 §2.4.1 자산군별 "주의" 임계 초과 | ⚠️ "최대낙폭이 자산군 임계치를 초과하여 자본 잠식 리스크가 확대됨. 하방 보호를 위해 방어적 자산 편입 비중 5~10%p 상향 검토 권고." |
| 샤프 비율 ≥ 2.0 | ⚡ "샤프 비율 2.0 이상은 통상 레버리지 또는 비정규 분포 위험을 동반함. 포지션 사이징과 꼬리 위험(Tail Risk) 노출 점검 필요." |
| 샤프 비율 < 0 | 🔻 "위험 조정 성과가 무위험 자산 대비 열위. 현 운용 전략의 알파 창출 능력 재검토 필요." |
| 단일 자산 비중이 §2.4.1 자산군별 집중 경고 임계 초과 | 🎯 "집중 리스크: 단일 자산이 자산군별 분산 권고를 초과. 분산 원칙 위배 가능성, 리밸런싱 권고." |
| 상관계수 > 0.8 자산쌍 ≥ 3개 | 🔗 "포트폴리오 내 다수 자산이 고상관(>0.8)으로 묶여 있어 분산 효과가 명목상에 그침. 비상관 자산군 편입 검토." |
| 베타가 §2.4.1 자산군별 "고변동" 기준 초과 | 📈 "자산군 시장 대비 고변동 구간. 강세장에서는 유리하나 약세장 진입 시 손실 폭이 비례 확대됨." |
| 정보 비율 < 0.5 | 💼 "벤치마크 추종 효율 저하. 액티브 운용의 부가가치가 추적 오차를 정당화하지 못함." |
| R² < 0.5 (벤치마크 대비) | 📊 "포트폴리오가 벤치마크와 구조적으로 상이함. 베타·알파 해석에 신중을 기하고 적합한 벤치마크 재선정 검토." |

### 5.3 인사이트 출력 포맷

```markdown
**[심각도 아이콘] [인사이트 제목]**
- **무엇이 발견되었나**: {observation} `[ref: metric=, period=, n=]`
- **왜 중요한가**: {implication}
- **권장 행동**: {recommended_action}
- **모니터링 지표**: {follow_up_metrics}
```

### 5.4 톤 & 매너

- **객관적·전문적**: 감탄사·과장된 형용사 금지 ("놀라운", "엄청난" 등)
- **간결성**: 한 인사이트는 4문장 이내
- **이해관계자 적응**:
  - C-레벨 → BLUF 중심, 행동 권고 강조
  - 애널리스트 → 지표·근거 상세, 방법론 노출
  - 일반 투자자 → 비유 활용 ("신호등 비유로 이해하면...")

---

## 6. 출력 계약 (Output Contract)

본 스킬의 최종 출력은 다음 통합 JSON 구조로 반환한다. 프론트엔드는 이 구조를 그대로 받아 렌더링할 수 있어야 한다.

### 6.1 최상위 인터페이스 및 하위 타입

```typescript
interface DashboardOutput {
  meta: {
    generated_at: string;       // ISO-8601
    skill_version: string;      // "1.1.0"
    mode: "quick" | "standard" | "full";
    input_period: { start: string; end: string };
    base_currency: string;
    risk_profile: "conservative" | "moderate" | "aggressive";
    warnings: string[];
  };
  kpis: KPI[];                  // 상단 패널용
  charts: ChartSpec[];          // 시각화 명세 배열 (Quick 모드에서는 빈 배열)
  report?: {                    // Quick 모드에서는 생략
    B: { bluf: string; kpis: KPI[] };
    U: { context: string; benchmark: BenchmarkComparison };
    I: { contributors: Attribution[]; detractors: Attribution[]; anchor_chart_id: string };
    L: { risk_metrics: RiskMetrics; scenarios: Scenario[] };
    D: { actions: ActionItem[]; monitoring: string[] };
  };
  insights: Insight[];          // 자동 생성된 코멘터리
  raw_metrics: SemanticMetrics; // 시맨틱 레이어가 산출한 모든 지표
}

interface KPI {
  id: string;
  label: string;                // "총 수익률", "샤프 비율"
  value: number;
  unit: "%" | "x" | "currency" | "score";
  change?: number;              // 직전 기간 대비 변동
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
  source: string;               // "Yahoo Finance / 2026-04-30 종가"
  caveat?: string;              // "표본 < 30, 통계적 유의성 낮음"
}

interface Attribution {
  asset_id: string;
  asset_name: string;
  contribution_pct: number;     // 포트폴리오 기여도 (양수=상승 기여)
  weight: number;
  return_pct: number;
}

interface RiskMetrics {
  mdd: number;
  downside_dev: number;
  sortino: number;
  var_95: number;
  asset_class_thresholds: Record<string, "ok" | "warn" | "critical">;  // §2.4.1
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
  deadline?: string;            // ISO-8601
  rationale: string;
}

interface Insight {
  severity: "info" | "warn" | "critical";
  icon: string;                 // "⚠️" | "⚡" | "🔻" | "🎯" | "🔗" | "📈"
  title: string;
  observation: string;          // "무엇이 발견되었나"
  implication: string;          // "왜 중요한가"
  recommended_action: string;
  follow_up_metrics: string[];
  ref: { metric: string; period: string; n: number };
}

interface BenchmarkComparison {
  benchmark_id: string;
  absolute_return: number;
  relative_return: number;
  tracking_error: number;
  attribution: Attribution[];
}

interface SemanticMetrics {
  returns: { simple: number; log: number; cumulative: number; cagr: number };
  risk: RiskMetrics;
  risk_adjusted: {
    sharpe: number; sortino: number; treynor: number;
    info_ratio: number; alpha: number; beta: number; r_squared: number;
  };
  benchmark: { id: string; performance: number; tracking_error: number };
  sample_size: number;
}
```

### 6.2 모드별 필드 채움 규칙

| 필드 | Quick | Standard | Full |
|---|---|---|---|
| `meta` | ✅ | ✅ | ✅ |
| `kpis` | 1개 (질의 지표) | 3~5개 | 모든 핵심 KPI |
| `charts` | `[]` | 3~4개 | 6~8개 |
| `report` | 생략 | 5단 요약 | 5단 전체 |
| `insights` | §5.2 트리거된 1개 | 트리거된 모든 항목 | 트리거 + 비조건부 인사이트 |
| `raw_metrics` | 질의 지표만 | 전체 | 전체 |

---

## 7. 운영 가드레일 (Operational Guardrails)

### 7.1 절대 금지 사항

- ❌ 본 명세에 정의되지 않은 지표를 임의로 계산·표시
- ❌ 시각화 매트릭스를 위반한 차트 선택 (예: 12개 자산을 도넛 차트로)
- ❌ BUILD 프레임워크 5단계 중 일부 생략 (Quick 모드 제외)
- ❌ 환각 데이터: 입력에 없는 자산·기간·이벤트 언급
- ❌ 투자 권유로 해석될 수 있는 단정적 미래 전망 ("반드시 오를 것")
- ❌ 무위험 자산보다 명백히 열위한 결과를 "양호"로 포장
- ❌ 자산군별 임계값(§2.4.1)을 무시한 단일 임계 적용

### 7.2 필수 포함 사항

- ✅ 모든 지표에 계산 기간 명시
- ✅ 모든 차트에 데이터 출처·기준일 표기
- ✅ 면책 조항: "본 분석은 정보 제공 목적이며 투자 자문이 아닙니다."
- ✅ 통계적 유의성 경고 (표본 < 30 등)
- ✅ `meta.mode` 필드에 적용된 출력 모드 명시
- ✅ `[ref: metric=, period=, n=]` 추적성 문구를 모든 인사이트에 부착

### 7.3 버전 관리

본 명세를 수정할 때는:
1. `version` 필드를 SemVer 규칙에 따라 갱신 (지표 정의 변경=메이저, 임계값 조정=마이너, 문구 수정=패치)
2. 변경 이력을 §10 CHANGELOG에 기록
3. 기존 버전으로 생성된 리포트와의 일관성 검증

---

## 8. 트리거 키워드 사전 (Activation Keywords)

다음 키워드가 사용자 입력에 포함되면 본 스킬을 우선 활성화한다:

**한국어**: 포트폴리오, 수익률, 투자 대시보드, 자산 배분, 리스크, 위험 지표, 샤프, 변동성, MDD, 낙폭, 벤치마크, 알파, 베타, 섹터 분석, 펀드 성과, ETF 분석

**English**: portfolio, return, dashboard, asset allocation, risk metrics, Sharpe, volatility, drawdown, benchmark, alpha, beta, sector analysis, fund performance, ETF analysis

**모드 분기 키워드**

- Quick 우선: "만", "얼마", "값", "수치", "only", "just"
- Full 우선: "심층", "리포트", "PDF", "자세히", "분석해줘", "deep", "detailed", "report"

---

## 9. 사용 예시 (Quick Start for Vibe Coding)

```
[사용자 입력]
"내 포트폴리오 데이터(portfolio.csv)를 분석해서 대시보드 만들어줘"

[에이전트 동작]
0. 입력 토큰 길이·키워드 분석 → 출력 모드 결정 (이 경우 Standard)
1. portfolio.csv → 섹션 1 스키마로 정규화
2. 섹션 2 시맨틱 레이어로 모든 지표 계산 (§2.4.1 자산군별 임계 적용)
3. 섹션 3 매트릭스에 따라 차트 자동 선택, §3.4 라이브러리 매핑으로 렌더 결정
4. 섹션 4 BUILD 헤더 구조로 리포트 조립
5. 섹션 5 임계값 트리거 검사 → 인사이트 삽입
6. 섹션 6 출력 계약 형식의 JSON 반환 (mode="standard" 명시)
7. 프론트엔드(React/Vue)가 JSON을 읽어 대시보드 렌더링
```

### 9.1 샘플 입력 → 출력 (E2E 예시)

**입력 1: Quick 모드 질의**

```
사용자: "내 포트폴리오 MDD만 알려줘"
```

→ 토큰 < 30, 단일 지표 키워드("MDD") → **Quick 모드** 자동 선택.

**입력 2: Standard 모드 질의 (CSV 업로드)**

`examples/portfolio_sample.csv` (발췌, 4행):

| asset_id | asset_class | quantity | avg_cost | acquired_at |
|---|---|---|---|---|
| 005930.KS | equity | 50 | 72000 | 2025-03-12 |
| QQQ | etf | 10 | 480.50 | 2025-06-01 |
| BTC-USD | crypto | 0.05 | 65000 | 2025-09-20 |
| KR1Y_BOND | bond | 100 | 98.5 | 2025-01-15 |

→ 다자산·다자산군 혼재 → **Standard 모드** 기본값.

**출력 요약** (`DashboardOutput` 발췌, JSON):

```json
{
  "meta": {
    "generated_at": "2026-05-06T10:00:00Z",
    "skill_version": "1.1.0",
    "mode": "standard",
    "input_period": { "start": "2025-01-15", "end": "2026-04-30" },
    "base_currency": "KRW",
    "risk_profile": "moderate",
    "warnings": ["BTC-USD 표본 수 < 60일, 통계적 유의성 보통"]
  },
  "kpis": [
    {
      "id": "kpi_total_return",
      "label": "총 수익률",
      "value": 12.4,
      "unit": "%",
      "change": 2.1,
      "semantic_color": "positive",
      "ref": { "metric": "cumulative_return", "period": "2025-01-15~2026-04-30", "n": 320 }
    },
    {
      "id": "kpi_sharpe",
      "label": "샤프 비율",
      "value": 1.42,
      "unit": "score",
      "semantic_color": "positive",
      "ref": { "metric": "sharpe", "period": "2025-01-15~2026-04-30", "n": 320 }
    },
    {
      "id": "kpi_mdd",
      "label": "MDD",
      "value": -18.3,
      "unit": "%",
      "semantic_color": "warning",
      "ref": { "metric": "mdd", "period": "2025-01-15~2026-04-30", "n": 320 }
    }
  ],
  "insights": [
    {
      "severity": "warn",
      "icon": "🎯",
      "title": "BTC 자산군 집중 경고",
      "observation": "BTC-USD 비중 22%로 crypto 자산군 임계(15%) 초과",
      "implication": "암호자산 단일 노출이 전체 변동성을 비대칭적으로 증폭",
      "recommended_action": "BTC 비중 10%로 트림(trim) 후 비상관 자산군(채권/금) 편입 검토",
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
          "rationale": "§2.4.1 crypto 단일 자산 집중 경고 임계 초과"
        }
      ],
      "monitoring": ["mdd", "concentration.crypto", "correlation_matrix"]
    }
  }
}
```

**핵심 검증 포인트**

- `mode` 필드로 모드 명시 → 프론트가 렌더 분기 가능 (§6.2)
- `RiskMetrics.asset_class_thresholds` 활용으로 자산군별 임계 평가 가능 (§2.4.1)
- 모든 KPI·Insight에 `ref` 추적성 부착 (§5.1)
- BTC 비중 22%가 단일 자산 임계 30%(equity 기준)는 미달이나 crypto 자산군 임계 15%를 초과한 사례 → 자산군별 차등이 단일 임계보다 의사결정에 유리함을 입증

---

## 10. 변경 이력 (CHANGELOG)

본 명세는 SemVer 규칙(§7.3)을 따른다. 메이저=지표 정의 변경, 마이너=임계값/구조 추가, 패치=문구 수정.

### [1.1.0] — 2026-05-07
**Added**
- §0.5 Quick / Standard / Full 3단 출력 모드 신설
- §2.4.1 자산군별 차등 임계값 표 (equity / etf / bond / crypto / commodity)
- §3.4 차트 타입 → 추천 라이브러리 매핑
- §6.1 ChartSpec / Insight / KPI / RiskMetrics 등 하위 타입 풀 정의
- §6.2 모드별 출력 필드 채움 규칙
- §9.1 샘플 입력 → 출력 E2E 예시
- §10 CHANGELOG 섹션

**Changed**
- §2.3 위험 조정 지표 표의 임계값 해석을 §2.4.1로 위임
- §5.1 인사이트 ref 추적 형식에 `n=` (표본 수) 필수화
- §5.2 임계값 트리거를 자산군별 차등으로 재정의
- §7.1 가드레일에 "자산군별 임계 무시 금지" 추가
- 본 문서 식별자: `Skills.md` → `skills_v1.md`

### [1.0.0] — 2026-05-05
**Initial**
- 9개 섹션 기본 명세 (파이프라인 → 정규화 → 시맨틱 → 시각화 → BUILD → NLG → 출력 → 가드레일 → 트리거)
- TypeScript 출력 인터페이스 최상위 정의

---

> **본 명세는 살아있는 문서이다.** 새로운 지표·시각화·인사이트 패턴이 도출되면 본 문서를 업데이트하고 버전을 올린다. 코드를 수정하지 말고 명세를 수정하라 — 코드는 명세로부터 다시 컴파일된다.
