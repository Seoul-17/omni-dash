---
name: financial-dashboard-generator
description: 투자 포트폴리오 데이터(거래내역 또는 잔고)를 입력받아 수익률·위험 지표를 계산하고, 데이터 특성에 맞는 차트를 자동 매핑하며, BUILD 프레임워크 기반의 인사이트 코멘터리까지 일괄 생성하는 통합 룰셋. 사용자가 "포트폴리오 분석", "수익률 시각화", "투자 대시보드 생성", "리스크 브리핑", "섹터별 동향 비교", "성과 리포트", "ETF·펀드 분석" 등을 요청할 때 즉시 트리거하여 입력 어댑터 → 데이터 정규화 → 지표 계산 → 시각화 매핑 → 스토리텔링 → 인사이트 생성 파이프라인을 가동한다. 질의 강도에 따라 Quick/Standard/Full 3단 출력 모드를 자동 선택하며, 사용자 audience(novice/intermediate/expert)에 따라 노출 지표를 분기한다.
version: 2.0.0
license: Apache-2.0
compatibility: Web frontend (React/Vue/HTML), Plotly/Recharts/D3 차트 라이브러리 호환, JSON/CSV/XBRL/거래내역 입력 지원
---

# 금융 투자 대시보드 자동 생성 명세서 (skills_v2.md)

> **목적**: 투자 분석의 암묵지를 기계 가독형 선언적 명세로 추상화하여, 어떤 형태의 투자 데이터가 들어오든 일관된 대시보드와 인사이트를 자동 생성한다.
>
> **설계 원칙**: 규칙(What) ↔ 구현(How)의 완전한 분리(Decoupling). 본 문서는 "무엇을 분석하고 어떻게 보여줄지"만 정의하며, 구체적 코드 구현은 AI 코딩 에이전트가 본 명세를 컴파일하여 생성한다.
>
> **v2.0.0 변경점 (요약)**: 거래내역 스키마 + 입력 어댑터(§1.1·§1.4), 4개 위험지표 추가(§2.3 VaR/CVaR/Calmar/Recovery), audience 노출 정책(§2.6), 시각화 5종 추가(§3.1), 초보자 용어 사전(§5.5), 출력 계약 타입 중복 제거 및 enum 통일(§6.1), 캐시·핫리로드 정책(§6.3). 자세한 이력은 별도 `CHANGELOG.md`.

---

## 0. 파이프라인 실행 순서

```
[0.5] 출력 모드·audience 결정  →  [1.4] 입력 어댑터  →  [1] 정규화  →  [2] 지표 계산
                                                                          ↓
[5] NLG 인사이트 생성  ←  [4] BUILD 리포트 구성  ←  [3] 시각화 선택·렌더링
```

각 단계는 다음 형식의 JSON을 다음 단계로 전달:
```json
{ "stage": 1, "mode": "standard", "audience": "intermediate", "normalized_data": {...}, "warnings": [], "next_stage": 2 }
```

---

## 0.5 출력 모드 (Output Modes)

기획서 §4 "3-Step 리포트 모드"의 ① 한눈에 보는 핵심 요약 / ② 종목별 상세 대시보드 / ③ 심층 데이터 리포트는 본 명세의 **Quick / Standard / Full**과 1:1 대응한다.

| 모드 | 트리거 조건 | 응답 시간 (p50 / p95, 캐시 적중 / 콜드) | 출력 범위 |
|---|---|---|---|
| **Quick** | 단일 지표 질의, 토큰 < 30 | p50 < 0.3s / 1.5s · 콜드 < 3s | §2 해당 지표 + §5.2 트리거 1줄 |
| **Standard** (기본) | 일반 분석 요청, 토큰 30~100 | p50 < 1.5s / 5s · 콜드 < 8s | §2 핵심 5지표 + §3 차트 3~4 + §4 BUILD 5단 요약 |
| **Full** | 명시적 풀 리포트, 다자산·다기간 비교 | p50 < 5s / 15s · 콜드 < 25s | §2 전체 + §3 차트 6~8 + §4 5단 + §5 모든 인사이트 + §6 전체 |

> **시연 1 정합성**: 시연 1의 "3초 만에" 약속은 Standard 콜드 8초로 대응하되, p50 1.5s 캐시 적중 사례를 시연용으로 사용. UX상 "3초 이내 첫 시각 응답" 보장.

### 0.5.1 모드 자동 결정
1. §8 트리거 키워드 매칭
2. 토큰 길이 + 지표 언급 개수 분기
3. 명시 지시("간단히", "자세히", "리포트")는 우선 적용
4. 기본값 **Standard**

### 0.5.2 모드 승격
- **Quick → Standard**: §5.2 임계 트리거 발동 시 자동 승격, 사용자에게 확장 확인.
- **Standard → Full**: 사용자 명시 지시 시 재실행, 기존 결과 캐시 유지.

### 0.5.3 출력 계약 연결
`DashboardOutput.meta.mode` 명시. 모드별 필드는 §6.2 참조.

---

## 1. 데이터 스키마 정규화

### 1.1 표준 입력 스키마

본 명세는 **거래내역(transactions)** 과 **잔고(portfolio holdings)** 를 모두 1차 입력으로 인정한다. 거래내역만 들어오면 §1.2 변환 규칙으로 잔고를 산출한다.

```yaml
asset:
  asset_id: string                # "AAPL", "005930.KS"
  asset_name: string
  asset_class: enum               # [equity, etf, fund, bond, crypto, commodity]
  sector: string                  # GICS 11개 또는 KRX 33개 분류, 미매핑 시 N/A
  base_currency: string           # ISO-4217

timeseries:
  timestamp: string               # ISO-8601 UTC, 나노초 보존
  asset_id: string
  open: number
  high: number
  low: number
  close: number                   # 필수
  volume: number | null
  adjusted_close: number          # 배당·분할 조정, 수익률 계산 우선

transactions:                     # NEW v2.0.0 — 매수/매도 이벤트 시계열
  transaction_id: string
  asset_id: string
  side: enum                      # [buy, sell, dividend, split, fee, deposit, withdrawal]
  quantity: number
  price: number                   # 거래 단가 (base_currency)
  fees: number                    # 수수료 + 세금
  executed_at: string             # ISO-8601
  tax_treatment: enum             # [pre_tax, post_tax, tax_free]

portfolio:                        # 잔고 (현재 시점 스냅샷)
  position_id: string
  asset_id: string
  quantity: number
  avg_cost: number                # 평단가
  weight: number                  # 0.0~1.0, 합계 1.0 ± 0.001
  acquired_at: string

analysis_config:                  # NEW v2.0.0 — 사용자 설정 일괄 관리
  base_currency: string           # 기본 USD
  risk_profile: enum              # [conservative, moderate, aggressive], 기본 moderate
  audience: enum                  # [novice, intermediate, expert], 기본 intermediate
  benchmark_id: string | null     # 미지정 시 §2.4 기본값
  analysis_period: { start: string, end: string } | null
```

### 1.2 정규화 강제 규칙

- **타임스탬프**: ISO-8601 UTC 강제, 나노초 보존, 타임존 없는 입력 거부.
- **통화 정규화**: 다중 통화 시 `analysis_config.base_currency`로 거래 timestamp 당일 종가 환율 환산. 환차손익은 별도 분리 보고.
- **결측치**: 가격 결측 → 직전 영업일 forward-fill (≤ 3영업일). 4영업일 이상 → 자산 제외 + warnings 기록.
- **이상치**: 일일 수익률 ±50% 초과 시 split/merge 의심 플래그, `adjusted_close` 재검증.
- **거래내역 → 잔고 변환** (NEW): 거래내역만 입력될 경우 다음 규칙으로 §1.1 portfolio 산출:
  - `quantity = Σ(buy.qty) - Σ(sell.qty)` (split·dividend는 자산별 정책 적용)
  - `avg_cost = Σ(buy.qty × buy.price + buy.fees) / Σ(buy.qty)` (이동평균법)
  - `weight = (quantity × current_close) / portfolio_market_value`
  - `acquired_at = min(buy.executed_at)` (최초 매수일)
  - 변환 결과는 `warnings`에 "거래내역 기반 산출, 평단가는 이동평균법" 명시
- **세후/세전 분리**: `transactions.tax_treatment`별로 수익률을 분리 산출하고 §6.1 출력에 `pre_tax_return`, `post_tax_return` 동시 노출.
- **XBRL 확장**: 표준 외 개념은 가장 가까운 표준에 매핑 + confidence score 0~1 부여.

### 1.3 검증 게이트

다음 검증 통과 시에만 다음 단계 진행:
- [ ] 필수 필드(`asset_id`, `timestamp`, `close`) null 아님
- [ ] `weight` 합계 1.0 ± 0.001
- [ ] `timestamp` strictly monotonic
- [ ] `base_currency` ISO-4217 유효
- [ ] (거래내역 입력 시) 모든 매도 수량 ≤ 누적 매수 수량 (음수 보유 방지)

### 1.4 입력 어댑터 (Input Adapters) — NEW v2.0.0

기획서 §5 시연 1·2 보장을 위한 어댑터 계층. 입력 컬럼 헤더가 표준 스키마와 다를 때 자동 매핑한다.

**자동 컬럼 매핑 사전** (한국어 우선):

| 표준 필드 | 한국어 후보 | 영어 후보 |
|---|---|---|
| `asset_id` | 종목코드, 티커, 코드 | ticker, symbol, code |
| `asset_name` | 종목명, 종목, 이름 | name, asset |
| `quantity` | 수량, 보유수량, 주식수 | qty, shares, units |
| `avg_cost` | 평단가, 매입가, 평균매입가 | avg_price, cost_basis |
| `executed_at` | 거래일, 매매일자, 일자 | trade_date, execution_date |
| `side` | 구분, 매매구분, 거래구분 | type, action |

**매핑 신뢰도가 0.8 미만**이면 사용자 확인 요청. 매핑 결과는 `warnings`에 기록.

**시연 2 보장 — 다중 포트폴리오 병합 정책**:
- 동일 사용자의 추가 업로드 시 기본은 **별도 포트폴리오로 비교 모드**.
- 사용자가 `merge: true` 지시 시 합산 (자산별 weight 재계산, 통화 다르면 base_currency 일괄 환산).
- 병합 결과는 `meta.portfolios: [...]` 배열로 노출.

---

## 2. 지표 계산 — Semantic Layer

### 2.1 시맨틱 레이어 원칙

본 섹션의 모든 지표는 **Single Source of Truth**. 차트·인사이트는 본 섹션 외 정의로 재계산 금지. 정의 변경 시 version 갱신 필수.

### 2.2 수익률 지표

| 지표 | 수식 | 적용 조건 | 주의 |
|---|---|---|---|
| **단순 수익률** | `R_t = (P_t - P_{t-1}) / P_{t-1}` | 횡단면 가중 합산 | 시계열 누적 금지 |
| **로그 수익률** | `r_t = ln(P_t / P_{t-1})` | 시계열 누적·복리 (기본값) | 횡단면 가중 합산 금지 |
| **누적 수익률** | `Π(1 + R_t) - 1` 또는 `Σr_t` | 기간 전체 성과 | 두 방식 혼용 금지 |
| **CAGR** | `(P_end / P_start)^(1/years) - 1` | 1년 이상 장기 | 산술평균 대체 시 과대추정 |

**기본값**: 시계열은 로그, 포트폴리오 일별은 단순 후 누적 시 로그 변환.

### 2.3 위험·위험 조정 성과 지표

| 지표 | 수식 | 측정 대상 | 임계값 해석 |
|---|---|---|---|
| **표준편차** (Volatility) | `σ = √(Σ(r-r̄)²/(n-1))` × √252 | 총 변동성 | §2.4.1 자산군별 차등 |
| **하방편차** (Downside Dev) | `√(Σmin(r-MAR,0)²/n)` | 하방 위험 | MAR 기본 = Rf |
| **VaR 95%** (Value at Risk) | `-percentile(returns, 5)` × portfolio_value | 95% 신뢰 손실 한계 | 일별·주별·연환산 모두 산출 |
| **CVaR 95%** (Expected Shortfall) | `-E[R \| R ≤ -VaR_95]` × portfolio_value | VaR 초과 영역 평균 손실 | 꼬리 위험 측정 표준 |
| **샤프 비율** | `(Rp - Rf) / σp` | 총 위험당 초과수익 | §2.4.1 자산군별 차등 |
| **소르티노 비율** | `(Rp - Rf) / 하방편차` | 하방 위험당 초과수익 | 방어적 운용 평가 |
| **트레이너 비율** | `(Rp - Rf) / β` | 체계적 위험당 초과수익 | β < 0.1 시 N/A |
| **칼마 비율** (Calmar) | `CAGR / \|MDD\|` | 낙폭 회복력 | ≥ 1.0 양호, 헷지펀드 평가 표준 |
| **정보 비율** | `Active Return / Tracking Error` | 액티브 운용 효율 | < 0.5 권고 미달 |
| **알파** (Jensen) | `Rp - [Rf + β(Rm-Rf)]` | 매니저 부가가치 | 양수 = 초과 수익 |
| **베타** | `Cov(Rp,Rm)/Var(Rm)` | 시장 민감도 | §2.4.1 자산군별 차등 |
| **MDD** | `min((P_t - 누적최고가) / 누적최고가)` | 최대 낙폭 | §2.4.1 자산군별 차등 |
| **회복 기간** (Recovery Period) | `MDD 시점 → 직전 최고가 회복까지 영업일` | 낙폭 지속성 | > 252영업일 시 "장기 침체" 경고 |
| **R²** | `(상관계수)²` | 벤치마크 설명력 | < 0.7 시 베타 해석 주의 |

### 2.4 기본 파라미터

```yaml
risk_free_rate: 0.04
trading_days_per_year: 252
benchmark_default:
  US: SPY
  KR: KODEX 200
  Global: ACWI
mar_default: 0.04
var_confidence: 0.95              # NEW v2.0.0
recovery_warning_days: 252        # NEW v2.0.0
```

`risk_profile`은 `analysis_config`(§1.1)로 입력받음.

### 2.4.1 자산군별 차등 임계값

| 임계값 | equity | etf | bond | crypto | commodity | 가이드 |
|---|---|---|---|---|---|---|
| 연환산 σ "정상" | 15~25% | 10~20% | 3~8% | 60~120% | 20~35% | 범위 초과 시 §5.2 경고 |
| MDD "주의" | -20% | -15% | -10% | -50% | -30% | 자본 잠식 경고 |
| 베타 "고변동" | > 1.3 | > 1.2 | > 0.5 | > 1.5 | > 1.2 | 자산군 시장 베타 |
| 샤프 "양호" | ≥ 1.0 | ≥ 0.8 | ≥ 0.4 | ≥ 1.5 | ≥ 0.6 | 자산군별 |
| 칼마 "양호" (NEW) | ≥ 0.5 | ≥ 0.4 | ≥ 0.2 | ≥ 0.7 | ≥ 0.3 | CAGR/\|MDD\| |
| CVaR 95% "주의" (NEW, 일별) | -3% | -2% | -1% | -10% | -4% | 꼬리 위험 |
| 단일 자산 집중 | > 30% | > 40% | > 50% | > 15% | > 20% | 분산 권고 |

**적용 규칙**:
- 다자산 혼재 시 가중평균: `threshold_portfolio = Σ(weight_i × threshold_class_i)`
- 자산군 불명확 시 가장 보수적 임계 적용
- `risk_profile`로 ±20% 조정: `conservative` -20%, `moderate` 표준, `aggressive` +20%
- 충족 여부는 §6.1 `RiskMetrics.asset_class_thresholds`에 `info | warn | critical`로 기록

### 2.5 계산 가드레일

- 표본 < 30 → "낮은 통계적 유의성" 플래그
- β 계산 시 R² < 0.5 → 결과 유보, 벤치마크 재검토 요청
- 분모 0 수렴 지표 → N/A, 무한대 표시 금지

### 2.6 audience 노출 정책 (NEW v2.0.0)

기획서 §1 타겟인 "초보 투자자"가 트레이너 비율·정보 비율을 보면 압도된다. audience별 노출 화이트리스트:

| audience | 노출 KPI | 노출 차트 | 인사이트 톤 (§5.4) |
|---|---|---|---|
| **novice** | 총 수익률, MDD, 변동성, 자산 비중 | line, donut, big_number, underwater | "신호등 비유" + §5.5 용어 사전 강제 |
| **intermediate** (기본) | + 샤프, 소르티노, 베타, CAGR | + treemap, multi_line, heatmap, bubble | 핵심 지표 + 간략 해석 |
| **expert** | 모든 §2.3 지표 | 모든 §3.1 차트 | 방법론·통계적 한계 노출 |

**자동 결정**: `analysis_config.audience` 미지정 시 입력 데이터 복잡도(자산 수·기간·자산군 다양성)로 추정. 단순 입력 → novice, 복잡 입력 → intermediate.

---

## 3. 시각화 선택 및 레이아웃

### 3.1 차트 선택 매트릭스

| 분석 목적 | 데이터 형태 | 선택 차트 | 핵심 인코딩 |
|---|---|---|---|
| 시계열 가격 추적 | OHLC 보유 | **캔들스틱** | 상승=녹/하락=적, 거래량 보조축 |
| 시계열 가격 추적 | 종가만 | **라인** | 단일 색, 2px |
| 다자산 시계열 비교 | 2~7개 | **다중 라인** | 시작값 100 정규화 |
| 다자산 시계열 비교 | 8개 이상 | **소형 다중** | 동일 y축 강제 |
| 자산 간 상관관계 | 상관 행렬 | **히트맵** | 발산형(-1청/0백/+1적), \|r\|≥0.8 주석 |
| **상관관계 시간 변화** (NEW) | 다기간 상관 행렬 | **상관 진화 라인** | 시점별 평균 상관, 위기 시점 어노테이션 |
| 포트폴리오 구성 | ≤5개 | **도넛** | 5% 미만 "기타" 통합 |
| 포트폴리오 구성 | ≥6개 / 계층 | **트리맵** | 면적=비중, 색=수익률 |
| 손익 변화 동인 | 변동 분해 | **워터폴** | 양=녹/음=적/합=청 |
| **요인 기여도** (NEW) | 시장/종목/타이밍 분해 | **요인 워터폴** | 요인별 색상 분리 |
| 단순 비교·랭킹 | ≤15개 | **수평 바** | 값 내림차순 |
| 분포·이상치 | 수익률 분포 | **히스토그램+박스** | 정규분포 보조선 |
| **드로다운 분포** (NEW) | 모든 드로다운 사건 | **히스토그램** | x=낙폭 깊이, y=빈도, p95 어노테이션 |
| 위험-수익 산점 | 다자산 비교 | **버블** | x=σ, y=수익, 크기=AUM |
| **효율적 프런티어** (NEW) | 위험-수익 곡선 | **산점+곡선** | 현 포지션 마커, 프런티어 곡선 |
| 단일 KPI 강조 | 핵심 1개 | **빅넘버+스파크라인** | 전기 대비 색상 |
| MDD 추적 | 시계열 낙폭 | **언더워터** | 0 baseline 음수 영역 |
| **롤링 윈도우 지표** (NEW) | 30/90일 롤링 샤프·변동성 | **롤링 라인** | 시간축 + 윈도우 크기 어노테이션 |

### 3.2 색상 거버넌스

```yaml
semantic_colors:
  positive: "#16A34A"
  negative: "#DC2626"
  neutral:  "#64748B"
  primary:  "#2563EB"
  benchmark: "#94A3B8"
  warning:  "#F59E0B"
  critical: "#991B1B"
```

색상에만 의미 부여 금지, 아이콘·레이블 보조 사용.

### 3.3 레이아웃 (Z-Layout)

```
┌─────────────────────────────────────────────────────┐
│ [1] KPI 요약  →  [2] 핵심 알림                       │
├─────────────────────────────────────────────────────┤
│ [3] 메인 시계열 (전체 너비)                          │
├──────────────────────┬──────────────────────────────┤
│ [4] 포트폴리오 구성   │ [5] 위험 지표 패널            │
├──────────────────────┴──────────────────────────────┤
│ [6] 상세 테이블 / 드릴다운                           │
└─────────────────────────────────────────────────────┘
```

- 상단 30% KPI / 중단 40% 메인 / 하단 30% 드릴다운
- 한 화면 6~8개 차트 상한 (Progressive Disclosure)
- 차트 간 패딩 24px 이상, 격자선·진한 테두리 금지
- 이중 축 차트 금지 (분리 차트 두 개 대체)
- 막대·영역 y축 0부터, 시계열 라인은 예외

### 3.4 차트 → 라이브러리 매핑

| ChartSpec.type | 1순위 | 2순위 | 비고 |
|---|---|---|---|
| candlestick | Plotly | Recharts custom | 거래량 보조축 |
| line / multi_line | Recharts | Plotly | 가벼움 |
| small_multiples | D3 + Recharts | Plotly subplot | ≥8 시계열 |
| heatmap / correlation_evolution | Plotly | D3 | 발산형 컬러 |
| donut | Recharts | Plotly | ≤5 자산 |
| treemap | Recharts | D3 | 면적·색상 |
| waterfall / factor_attribution | Plotly | Recharts custom | 양음 분리 |
| horizontal_bar | Recharts | Plotly | 정렬 |
| histogram_box / drawdown_dist | Plotly | D3 | 분포 |
| bubble / efficient_frontier | Recharts | Plotly | 산점 |
| big_number_sparkline | 자체 + Recharts mini | — | KPI |
| underwater | Recharts area | Plotly | MDD |
| rolling_window | Recharts | Plotly | 윈도우 어노테이션 |

**원칙**: 기본 Recharts (React 친화·작은 번들). Plotly는 캔들스틱·히트맵·워터폴 등 통계 전용. D3는 세밀 제어. 색상 토큰(§3.2)은 모든 라이브러리 동일 적용.

---

## 4. 리포트 구성 — BUILD 프레임워크

### 4.1 5단계 헤더 구조 (Quick 모드 제외)

```markdown
### 📌 요약 (Begin with the End in Mind)
- BLUF: 핵심 결론 1~2문장 + 즉각 행동
- 핵심 KPI 3개

### 🌐 거시 경제 맥락 (Understand the Context)
- 분석 기간 시장 환경
- 벤치마크 대비 성과 (절대·상대)
- 외부 이벤트 연관성

### 💡 성과 동인 (Illustrate Insights)
- 긍정 기여 상위 3개 (기여도 %)
- 부정 기여 상위 3개
- 앵커 시각화 1개

### ⚠️ 위험 지표 및 의미 (Link Data to Implications)
- 하방 중심 (MDD, 하방편차, 소르티노, CVaR)
- "So What?" 비즈니스적 함의
- 시나리오 (낙관/기준/비관)

### ✅ 권고 사항 (Drive Action)
- 액션 아이템 (자산·비중·시점)
- 책임자·데드라인
- 모니터링 후속 지표
```

### 4.2 섹션별 데이터 플레이스홀더

```yaml
B_section: { bluf_statement, top_kpi_1~3 }
U_section: { market_regime, benchmark_performance: { absolute, relative, attribution } }
I_section: { top_contributors, top_detractors, anchor_chart }
L_section: { risk_metrics: { mdd, cvar_95, sortino, recovery_days, ... }, scenarios }
D_section: { action_items, monitoring_kpis }
```

---

## 5. 인사이트 자동 생성 (NLG)

### 5.1 원칙

- **숫자 나열 금지** — 비교·맥락 동반
- **인과 3단** — 원인 → 결과 → 함의
- **추적성 강제** — `[ref: metric=, period=, n=]`
- **환각 방지** — §2 외 지표 언급 금지
- **편향 회피** — 단정 미래 전망 금지, 조건부 진술만

### 5.2 임계값 트리거 (자산군별 §2.4.1 우선)

| 트리거 조건 | 자동 생성 인사이트 |
|---|---|
| MDD > 자산군 "주의" 임계 | ⚠️ "최대낙폭이 자산군 임계치 초과, 자본 잠식 리스크 확대. 방어 자산 5~10%p 상향 권고." |
| 회복 기간 > 252영업일 (NEW) | ⏳ "1년 이상 장기 침체 진행. 손실 방치 비용 vs 손절 비교 검토." |
| CVaR 95% > 자산군 임계 (NEW) | 💥 "꼬리 위험이 자산군 일반 수준 초과. 극단적 시장 충격 시 평균 손실폭 확대 예상." |
| 샤프 ≥ 2.0 | ⚡ "샤프 2.0 이상은 통상 레버리지·비정규 분포 동반. 꼬리 위험 점검." |
| 샤프 < 0 | 🔻 "위험 조정 성과 무위험 열위. 알파 창출 능력 재검토." |
| 칼마 < 자산군 양호 (NEW) | 📉 "낙폭 회복력 자산군 일반 수준 미달. 진입 시점 재고 권고." |
| 단일 자산 > 자산군 집중 임계 | 🎯 "집중 리스크: 자산군별 분산 권고 초과. 리밸런싱 권고." |
| 상관 > 0.8 자산쌍 ≥ 3 | 🔗 "다수 자산 고상관, 분산 효과 명목상. 비상관 자산 편입 검토." |
| 베타 > 자산군 "고변동" | 📈 "자산군 시장 대비 고변동. 약세장 손실 비례 확대." |
| 정보 비율 < 0.5 | 💼 "벤치마크 추종 효율 저하. 액티브 부가가치 추적 오차 미정당화." |
| R² < 0.5 | 📊 "포트폴리오 ↔ 벤치마크 구조적 상이. 적합 벤치마크 재선정 검토." |

### 5.3 인사이트 출력 포맷

```markdown
**[심각도 아이콘] [제목]**
- **무엇이 발견되었나**: {observation} `[ref: metric=, period=, n=]`
- **왜 중요한가**: {implication}
- **권장 행동**: {recommended_action}
- **모니터링 지표**: {follow_up_metrics}
```

### 5.4 톤 & 매너 (audience 분기)

- **객관적·전문적** — 감탄사·과장 형용사 금지
- **간결성** — 1 인사이트 4문장 이내
- **audience 적응** (§2.6 연동):
  - novice → §5.5 용어 사전으로 풀어쓰기, 신호등 비유
  - intermediate → 핵심 지표 + 간략 해석
  - expert → 방법론·통계적 한계 노출

### 5.5 초보자 용어 사전 (NEW v2.0.0)

novice audience에서는 다음 매핑을 강제 적용한다:

| 전문 용어 | 초보자용 풀이 | 비유 |
|---|---|---|
| MDD (Max Drawdown) | 최대 낙폭 — 자산이 가장 많이 떨어졌을 때의 폭 | "산 정상에서 골짜기까지의 깊이" |
| 변동성 (Volatility) | 가격이 출렁이는 정도 | "파도의 높이" |
| 샤프 비율 | 같은 위험을 졌을 때 얼마나 수익을 더 냈는지 | "비싼 입장료 낸 만큼 즐거웠는가" |
| 베타 | 시장이 1% 움직일 때 내 자산이 몇 % 움직이는지 | "시장 따라가기 민감도" |
| MAR | 최소한 이 정도는 벌어야 만족 (기본 4%) | "통과 기준선" |
| VaR 95% | 100일 중 95일은 이보다 덜 잃는다 | "최악의 5%를 제외한 손실 한계" |
| CVaR 95% | 그 최악의 5% 영역 평균 손실 | "재난급 시나리오 평균 피해" |
| 상관계수 | 두 자산이 같이 움직이는 정도 (-1~+1) | "쌍둥이 vs 무관한 사람" |
| 회복 기간 | 손실에서 본전 회복까지 걸린 날짜 | "낙상 후 재활 기간" |
| 칼마 비율 | 큰 낙폭을 감수하고 얻은 연수익 효율 | "고통 대비 보상" |

---

## 6. 출력 계약 (Output Contract)

### 6.1 인터페이스

```typescript
type Severity = "info" | "warn" | "critical";   // v2.0.0: 통일

interface DashboardOutput {
  meta: {
    generated_at: string;
    skill_version: string;                       // "2.0.0"
    mode: "quick" | "standard" | "full";
    audience: "novice" | "intermediate" | "expert";
    input_period: { start: string; end: string };
    base_currency: string;
    risk_profile: "conservative" | "moderate" | "aggressive";
    portfolios?: PortfolioMeta[];                // 다중 업로드 시
    cache_key?: string;                          // §6.3
    warnings: string[];
  };
  kpis: KPI[];
  charts: ChartSpec[];                           // Quick 모드 시 []
  report?: {
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
  semantic_color: Severity | "positive" | "negative" | "neutral";
  ref: { metric: string; period: string; n: number };
}

interface ChartSpec {
  id: string;
  type:
    | "candlestick" | "line" | "multi_line" | "small_multiples"
    | "heatmap" | "correlation_evolution"
    | "donut" | "treemap"
    | "waterfall" | "factor_attribution"
    | "horizontal_bar" | "histogram_box" | "drawdown_dist"
    | "bubble" | "efficient_frontier"
    | "big_number_sparkline" | "underwater" | "rolling_window";
  title: string;
  data: { x: any[]; y: any[]; series?: string[] };
  encoding: {
    x_axis?: { label: string; type: "time" | "category" | "linear" };
    y_axis?: { label: string; type: "linear" | "log"; zero_baseline: boolean };
    color_map?: Record<string, string>;
  };
  annotations?: { x: any; y: number; text: string }[];
  source: string;
  caveat?: string;
}

interface Attribution {
  asset_id: string;
  asset_name: string;
  contribution_pct: number;
  weight: number;
  return_pct: number;
}

interface RiskMetrics {                          // v2.0.0: sortino 단일 위치
  mdd: number;
  recovery_days: number | null;                  // NEW
  downside_dev: number;
  sortino: number;
  var_95: number;
  cvar_95: number;                               // NEW
  calmar: number;                                // NEW
  asset_class_thresholds: Record<string, Severity>;
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
  deadline?: string;
  rationale: string;
}

interface Insight {
  severity: Severity;
  icon: string;
  title: string;
  observation: string;
  implication: string;
  recommended_action: string;
  follow_up_metrics: string[];
  ref: { metric: string; period: string; n: number };
}

interface BenchmarkComparison {                  // v2.0.0: tracking_error 단일 위치
  benchmark_id: string;
  absolute_return: number;
  relative_return: number;
  tracking_error: number;
  attribution: Attribution[];
}

interface SemanticMetrics {                      // v2.0.0: sortino·tracking_error 중복 제거
  returns: {
    simple: number; log: number; cumulative: number; cagr: number;
    pre_tax?: number; post_tax?: number;         // NEW
  };
  risk: RiskMetrics;
  risk_adjusted: {
    sharpe: number; treynor: number; info_ratio: number;
    alpha: number; beta: number; r_squared: number;
  };
  benchmark: { id: string; performance: number };
  sample_size: number;
}
```

### 6.2 모드별 필드 채움

| 필드 | Quick | Standard | Full |
|---|---|---|---|
| `meta` | ✅ | ✅ | ✅ |
| `kpis` | 1개 | 3~5개 | 모두 |
| `charts` | `[]` | 3~4개 | 6~8개 |
| `report` | 생략 | 5단 요약 | 5단 전체 |
| `insights` | §5.2 1개 | 트리거 모두 | 트리거 + 비조건부 |
| `raw_metrics` | 질의 지표만 | 전체 | 전체 |

### 6.3 캐시·핫리로드 정책 (NEW v2.0.0 — 시연 3 보장)

기획서 §5 시연 3 "Skills.md 텍스트 수정 → 즉시 반영"을 위해:

**캐시 키**: `cache_key = hash(input_data, skill_version, audience, mode, risk_profile)`

**무효화 규칙**:
- `skill_version` 변경 → 모든 캐시 무효
- `analysis_config` 임계값 수정 → §2.4.1 임계 의존 인사이트만 무효
- 입력 데이터 추가 → 해당 portfolio_id 캐시만 무효

**의존성 그래프** (어느 명세 변경이 어느 출력에 영향):
- §2 시맨틱 변경 → KPI·report·raw_metrics 전체 재계산
- §2.4.1 임계 변경 → insights·RiskMetrics.asset_class_thresholds만 재계산
- §3 시각화 매트릭스 변경 → charts만 재렌더
- §5.5 용어 사전 변경 → novice audience 출력 텍스트만 재생성

핫리로드 시 `meta.cache_key`와 함께 `meta.invalidated: ["insights", ...]` 명시.

---

## 7. 운영 가드레일

### 7.1 절대 금지

- ❌ §2에 정의되지 않은 지표 임의 계산·표시
- ❌ 시각화 매트릭스 위반 (12개 자산을 도넛으로 등)
- ❌ BUILD 5단계 일부 생략 (Quick 제외)
- ❌ 환각 데이터 (입력 외 자산·기간·이벤트)
- ❌ 단정 미래 전망
- ❌ 무위험 열위 결과를 "양호" 포장
- ❌ 자산군별 임계(§2.4.1) 무시한 단일 임계 적용
- ❌ audience와 무관한 지표·차트·톤 노출

### 7.2 필수 포함

- ✅ 모든 지표에 계산 기간 명시
- ✅ 모든 차트에 데이터 출처·기준일
- ✅ 면책: "정보 제공 목적이며 투자 자문이 아닙니다."
- ✅ 통계적 유의성 경고 (n < 30 등)
- ✅ `meta.mode`, `meta.audience` 명시
- ✅ `[ref: metric=, period=, n=]` 모든 인사이트 부착

### 7.3 버전 관리

- SemVer (지표·타입 변경=메이저, 임계·구조 추가=마이너, 문구=패치)
- 별도 `CHANGELOG.md` 기록
- 기존 버전 출력과의 일관성 검증

### 7.4 자동 검증 케이스 (NEW v2.0.0)

`docs/skills/examples/` 디렉토리에 5개 골든 케이스 (입력 CSV → 기대 출력 JSON). 명세 수정 시 골든 출력과 diff 검증.

---

## 8. 트리거 키워드

**한국어**: 포트폴리오, 수익률, 투자 대시보드, 자산 배분, 리스크, 위험 지표, 샤프, 변동성, MDD, 낙폭, 벤치마크, 알파, 베타, 섹터 분석, 펀드 성과, ETF 분석, VaR, CVaR, 칼마, 회복

**English**: portfolio, return, dashboard, asset allocation, risk metrics, Sharpe, volatility, drawdown, benchmark, alpha, beta, sector, fund, ETF, VaR, CVaR, Calmar, recovery

**모드 분기**: Quick — "만/얼마/값/수치/only/just" / Full — "심층/리포트/PDF/자세히/deep/detailed/report"

**audience 분기**: novice — "쉽게/초보/처음/easy/simple" / expert — "방법론/통계적/methodology/rigorous"

---

## 9. 사용 예시

```
[입력] "내 포트폴리오(portfolio.csv) 분석해서 대시보드 만들어줘"

[동작]
0. 토큰·키워드 분석 → mode=Standard, audience=intermediate
1.4. 입력 어댑터로 컬럼 매핑 (종목코드 → asset_id 등)
1. 표준 스키마 정규화. 거래내역이면 §1.2 변환으로 잔고 산출.
2. 시맨틱 레이어 계산 (자산군별 임계 §2.4.1)
3. 차트 자동 선택, §3.4 라이브러리 매핑
4. BUILD 5단 조립
5. §5.2 트리거 검사 → 인사이트 삽입 (audience별 톤)
6. JSON 반환 (mode·audience·cache_key 명시)
7. 프론트(React/Vue) 렌더링
```

### 9.1 E2E 샘플

**Case A — Quick 모드 (단일 지표)**

입력: `"내 포트폴리오 MDD만 알려줘"`

출력:
```json
{
  "meta": {
    "generated_at": "2026-05-07T09:00:00Z",
    "skill_version": "2.0.0",
    "mode": "quick",
    "audience": "intermediate",
    "input_period": { "start": "2025-01-15", "end": "2026-04-30" },
    "base_currency": "KRW",
    "risk_profile": "moderate",
    "warnings": []
  },
  "kpis": [
    {
      "id": "kpi_mdd",
      "label": "MDD",
      "value": -18.3,
      "unit": "%",
      "semantic_color": "warn",
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
    "risk": { "mdd": -18.3, "recovery_days": null, "downside_dev": 0.12, "sortino": 0.85, "var_95": -2.4, "cvar_95": -3.7, "calmar": 0.41, "asset_class_thresholds": { "equity": "info", "etf": "warn", "crypto": "critical", "bond": "info" } },
    "sample_size": 320
  }
}
```

**Case B — Standard 모드 (다자산)**

입력 CSV (`examples/03_multi_asset.csv` 발췌):

| asset_id | asset_class | quantity | avg_cost | acquired_at |
|---|---|---|---|---|
| 005930.KS | equity | 50 | 72000 | 2025-03-12 |
| QQQ | etf | 10 | 480.50 | 2025-06-01 |
| BTC-USD | crypto | 0.05 | 65000 | 2025-09-20 |
| KR1Y_BOND | bond | 100 | 98.5 | 2025-01-15 |

출력 (발췌):
```json
{
  "meta": {
    "skill_version": "2.0.0",
    "mode": "standard",
    "audience": "intermediate",
    "risk_profile": "moderate",
    "cache_key": "abc123...",
    "warnings": ["BTC-USD 표본 < 60일, 통계 보통"]
  },
  "kpis": [
    { "id": "kpi_total_return", "label": "총 수익률", "value": 12.4, "unit": "%", "change": 2.1, "semantic_color": "positive", "ref": {...} },
    { "id": "kpi_sharpe", "label": "샤프 비율", "value": 1.42, "unit": "score", "semantic_color": "positive", "ref": {...} },
    { "id": "kpi_mdd", "label": "MDD", "value": -18.3, "unit": "%", "semantic_color": "warn", "ref": {...} },
    { "id": "kpi_calmar", "label": "칼마 비율", "value": 0.41, "unit": "score", "semantic_color": "warn", "ref": {...} },
    { "id": "kpi_cvar", "label": "CVaR 95%", "value": -3.7, "unit": "%", "semantic_color": "warn", "ref": {...} }
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
          "rationale": "§2.4.1 crypto 단일 자산 집중 임계 초과"
        }
      ],
      "monitoring": ["mdd", "concentration.crypto", "correlation_matrix", "recovery_days"]
    }
  }
}
```

**검증 포인트**:
- `mode`·`audience` 명시 → 프론트 렌더 분기 + 톤 분기 가능
- `RiskMetrics`에 VaR·CVaR·Calmar·recovery_days 동시 노출
- enum 통일 (`warn`·`critical`·`info`)
- `tracking_error`·`sortino` 단일 정의로 중복 제거 검증
- BTC 22%가 equity 임계 30% 미달이나 crypto 15% 초과 — 자산군별 차등 효과

---

> **본 명세는 살아있는 문서이다.** 새로운 지표·시각화·인사이트 패턴이 도출되면 본 문서를 업데이트하고 버전을 올린다. 코드를 수정하지 말고 명세를 수정하라 — 코드는 명세로부터 다시 컴파일된다.
>
> **변경 이력**: 별도 `CHANGELOG.md` 참조.
