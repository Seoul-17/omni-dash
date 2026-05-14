---
title: "Omni-Dash Skills 명세 — 금융 투자 대시보드 자동 생성"
subtitle: "v3.0.0 병합본 (6모듈 통합) — 2026-05-07"
author: "Omni-Dash Team (김해찬·천창현·이정원)"
date: "2026-05-07"
license: "Apache-2.0"
---

# Omni-Dash Skills 명세 (병합본)

> **본 문서는 6개 역할별 모듈 + INDEX + CHANGELOG를 단일 문서로 병합한 제출용 PDF 원본입니다.**
> 모듈별 개별 파일은 `docs/final_skills/` 디렉토리 또는 `skills.zip`을 참조하세요.

**버전**: v3.0.0
**제출일**: 2026-05-07
**라이선스**: Apache-2.0
**언어**: 한국어 (출력 인사이트는 `analysis_config.locale`에 따라 ko-KR / en-US 분기)

---

## 목차

1. [개요·진입점 (README)](#개요)
2. [모듈 인덱스·의존 그래프 (INDEX)](#모듈-인덱스)
3. **Part 1 — 코어** [00. Core Skills](#00-core-skills)
4. **Part 2 — 데이터** [01. Data Skills](#01-data-skills)
5. **Part 3 — 지표** [02. Metrics Skills](#02-metrics-skills)
6. **Part 4 — 시각화** [03. Visualization Skills](#03-visualization-skills)
7. **Part 5 — 리포트** [04. Report Skills](#04-report-skills)
8. **Part 6 — 출력 계약** [05. Contract Skills](#05-contract-skills)
9. [변경 이력 (CHANGELOG)](#변경-이력)
10. [부록 A — 골든 케이스 인덱스](#부록-a)

---

# 개요

## 무엇인가

투자 데이터(CSV·JSON·거래내역)를 입력하면 검증된 분석 규칙으로 위험·수익 지표를 계산하고, 데이터 특성에 맞는 차트를 자동 선택하며, BUILD 5단 프레임워크로 인사이트를 자동 생성하는 **금융 대시보드 명세 시스템**.

## 핵심 차별화 4가지

1. **Quick / Standard / Full 3단 출력 모드** — "MDD만" 같은 단순 질의에 풀 파이프라인을 강제하지 않음
2. **자산군별 차등 임계값** — 채권 0.5와 암호자산 1.0의 의미가 완전히 다름. 단일 임계 대신 상대 프레임워크
3. **audience 노출 정책** (novice/intermediate/expert) — 초보 투자자가 트레이너 비율을 보고 압도되지 않도록 화이트리스트
4. **`[ref: metric=, period=, n=]` 추적성 강제** — LLM 환각 차단 + 검증 가능성 확보

## 명세 시스템 한 그림

```
사용자 입력 (CSV / JSON / 거래내역)
         ↓
[00] Core — 출력 모드·audience·전역 가드레일 (항상 로드)
         ↓
[01] Data — 입력 어댑터 → 거래내역 변환 → 표준 정규화
         ↓
[02] Metrics — 시맨틱 레이어 14지표 + 자산군별 차등 임계
         ↓
   ┌─────┴─────┐
[03] Visualization  [04] Report (BUILD·NLG)
   └─────┬─────┘
         ↓
[05] Contract — JSON 출력 계약 + 캐시·핫리로드
         ↓
   프론트엔드 (React/Vue) 렌더링
```

## 핵심 가치 (기획서 §1)

| 가치 | 본 명세에서의 실현 |
|---|---|
| **재사용성** | 모듈별 분할로 다른 도메인(부동산·예술품 투자 등) 부분 재사용 가능 |
| **검증 가능성** | `[ref:]` 추적성 + `examples/` 골든 케이스 |
| **협업성** (비개발자 수정) | 마크다운 텍스트 수정만으로 임계·룰 변경 (시연 3) |
| **모듈성** | 6개 파일 단일 책임, 의존성 그래프 명시 |

\newpage

# 모듈 인덱스

| # | 파일 | 역할 (한 줄) | 라인 |
|---|---|---|---|
| 0 | 00_core_skills.md | 진입점·파이프라인·출력 모드·audience 결정·전역 가드레일·트리거 키워드 | 143 |
| 1 | 01_data_skills.md | 데이터 정규화·거래내역 변환·입력 어댑터·다중 포트폴리오 병합 | 163 |
| 2 | 02_metrics_skills.md | 시맨틱 레이어·자산군별 차등 임계·audience 노출 정책 | 143 |
| 3 | 03_visualization_skills.md | 차트 선택 매트릭스·색상 거버넌스·Z-Layout·라이브러리 매핑 | 137 |
| 4 | 04_report_skills.md | BUILD 5단 프레임워크·NLG 인사이트·임계 트리거·초보자 용어 사전 | 152 |
| 5 | 05_contract_skills.md | TypeScript 출력 계약·모드별 채움·캐시·핫리로드·E2E 예시 | 367 |

## 의존 관계

```
                  00_core_skills  ← 항상 로드
                          │
                          ↓
            01_data_skills  (정규화·어댑터)
                          │
                          ↓
            02_metrics_skills  (지표·임계·audience)
                          │
                ┌─────────┴─────────┐
                ↓                   ↓
   03_visualization_skills    04_report_skills
        (차트 매핑)              (BUILD·NLG)
                └─────────┬─────────┘
                          ↓
            05_contract_skills  (직렬화·캐시)
                          │
                          ↓
                    프론트엔드 렌더링
```

- **00**: 메타·전역 정책. 어떤 단계든 항상 로드.
- **01 → 02**: 정규화된 데이터가 시맨틱 레이어 입력.
- **02 → 03·04**: 지표는 차트 선택과 인사이트 생성에 모두 필요.
- **03·04 → 05**: 시각화 결과 + 인사이트가 출력 계약으로 직렬화.

## 빠른 참조 — "어디 가서 무엇을 찾는가"

| 질문 | 위치 |
|---|---|
| 어떤 모드(Quick/Standard/Full)가 언제 적용되는가? | `00 §0.2` |
| audience(novice/expert) 결정 우선순위는? | `00 §0.3`, `02 §2.6.1` |
| audience × mode 충돌 시 무엇이 우선? | `00 §0.3.1` |
| 거래내역 CSV를 잔고로 어떻게 바꾸는가? | `01 §1.2.2` |
| FIFO/LIFO/이동평균 어디서 선택? | `01 §1.1 analysis_config.cost_basis_method` |
| MDD 자산군별 임계값은? | `02 §2.4.1` |
| VaR·CVaR·Calmar 정의는? | `02 §2.3` |
| 12개 자산일 때 어떤 차트? | `03 §3.1` (트리맵 또는 소형 다중) |
| Recharts vs Plotly 언제? | `03 §3.4.1` |
| BUILD 5단 헤더 구조는? | `04 §4.1` |
| MDD 임계 초과 시 자동 인사이트? | `04 §4.4` |
| novice용 "MDD" 풀이는? | `04 §4.7` |
| 출력 JSON의 `RiskMetrics` 타입은? | `05 §6.1` |
| 캐시 키는 무엇으로? | `05 §6.3.1` |
| Skills.md 수정 시 캐시 무효화? | `05 §6.3.2` |

## 핵심 설계 원칙

| 원칙 | 의미 | 구현 위치 |
|---|---|---|
| **Decoupling** | 규칙(What) ↔ 구현(How) 분리 | 본 명세는 무엇만 정의, 코드는 LLM 컴파일 |
| **Single Source of Truth** | 지표는 한 곳에서만 정의 | `02_metrics_skills` 시맨틱 레이어 |
| **Progressive Disclosure** | 자주 쓰는 규칙만 본문, 세부는 분리 | 본 6모듈 분할 자체 |
| **Guardrails First** | 안전한 기본값과 금지 행위 우선 | `00 §0.5`, 모듈별 가드레일 |

\newpage

# 00. Core Skills

> 본 모듈은 financial-dashboard 스킬 시스템의 **진입점**이다. LLM/에이전트는 어떤 단계의 작업을 하든 본 모듈을 항상 먼저 로드하여 파이프라인 순서·출력 모드·audience·전역 가드레일을 결정한다.

## 0.1 파이프라인 실행 순서

```
[0] 출력 모드·audience 결정 (본 모듈)
       ↓
[1] 입력 어댑터 → 정규화 (→ 01_data_skills)
       ↓
[2] 시맨틱 레이어 지표 계산 (→ 02_metrics_skills)
       ↓
[3] 시각화 매트릭스 매핑 (→ 03_visualization_skills)
       ↓
[4] BUILD 리포트 + NLG 인사이트 (→ 04_report_skills)
       ↓
[5] 출력 계약 직렬화 + 캐시 (→ 05_contract_skills)
```

각 단계 페이로드: `{ "stage": N, "mode": "...", "audience": "...", "data": {...}, "warnings": [], "next_stage": N+1 }`

## 0.2 출력 모드 (Output Modes)

기획서 §4 "3-Step 리포트 모드"(① 핵심 요약 / ② 종목별 상세 / ③ 심층 리포트)는 본 모드의 **Quick / Standard / Full**과 1:1 대응.

| 모드 | 트리거 조건 | 응답 시간 (p50 / p95, 캐시 / 콜드) | 출력 범위 |
|---|---|---|---|
| **Quick** | 단일 지표 질의, 토큰 < 30 | p50 < 0.3s / 1.5s · 콜드 < 3s | 해당 지표 + 임계 트리거 1줄 |
| **Standard** (기본) | 일반 분석, 토큰 30~100 | p50 < 1.5s / 5s · 콜드 < 8s | 핵심 5지표 + 차트 3~4 + BUILD 5단 요약 |
| **Full** | 명시적 풀 리포트, 다자산·다기간 | p50 < 5s / 15s · 콜드 < 25s | 전체 지표 + 차트 6~8 + BUILD 5단 + 모든 인사이트 |

### 0.2.1 모드 자동 결정 로직

1. §0.4 트리거 키워드 매칭
2. 토큰 길이 + 지표 언급 개수 분기
3. 명시 지시("간단히", "자세히", "리포트") 우선 적용
4. 기본값 **Standard**

### 0.2.2 모드 승격

- **Quick → Standard**: §5.2 임계 트리거 발동 시 자동 승격, 사용자에게 확장 확인.
- **Standard → Full**: 사용자 명시 지시 시 재실행, 기존 결과 캐시 유지.

## 0.3 audience × mode × 트리거 충돌 해소

`audience`(novice/intermediate/expert)는 **사용자의 금융 지식 수준**의 함수이지 데이터 복잡도가 아니다. 입력 우선순위:

1. `analysis_config.audience` (→ `01_data_skills` §1.1) 명시 → 우선 적용
2. §0.4 audience 분기 키워드 ("쉽게/처음" → novice, "방법론" → expert)
3. UI에서 명시 선택
4. 기본값 **intermediate**

> ❌ "데이터 복잡도로 audience 추정" 같은 자동 분류는 **금지**. 차원이 다름.

### 0.3.1 충돌 해소 우선순위 매트릭스

| 충돌 시나리오 | 우선 적용 | 사유 |
|---|---|---|
| **모드 vs audience**: novice + Full → 차트 6~8개 vs 화이트리스트 4종 | **audience 우선** | 사용자 친화 — 인지 부하 보호 |
| **트리거 vs audience**: novice + 베타 트리거 발동(베타는 화이트리스트 외) | **트리거 우선 + KPI 임시 노출** | 인사이트의 검증 가능성 보장 |
| **모드 vs 트리거**: Quick + §5.2 트리거 발동 | **트리거 우선 → Standard 승격** | 위험 신호 누락 방지 |
| **audience 미지정 + risk_profile aggressive** | **expert 추정** | 위험 감수 의지가 높은 사용자는 통상 지식 수준도 높음 |

본 매트릭스 적용 결과는 `meta.conflict_resolution: { rule, applied }` 필드(→ `05_contract_skills` §6.1)에 기록.

## 0.4 트리거 키워드 사전

### 0.4.1 스킬 활성화

**한국어**: 포트폴리오, 수익률, 투자 대시보드, 자산 배분, 리스크, 위험 지표, 샤프, 변동성, MDD, 낙폭, 벤치마크, 알파, 베타, 섹터 분석, 펀드 성과, ETF 분석, VaR, CVaR, 칼마, 회복

**English**: portfolio, return, dashboard, asset allocation, risk metrics, Sharpe, volatility, drawdown, benchmark, alpha, beta, sector analysis, fund performance, ETF analysis, VaR, CVaR, Calmar, recovery

### 0.4.2 모드 분기

- **Quick**: "만 / 얼마 / 값 / 수치 / only / just"
- **Full**: "심층 / 리포트 / PDF / 자세히 / deep / detailed / report"

### 0.4.3 audience 분기

- **novice**: "쉽게 / 초보 / 처음 / easy / simple / beginner"
- **expert**: "방법론 / 통계적 / methodology / rigorous / advanced"

## 0.5 운영 가드레일

### 0.5.1 절대 금지

- ❌ 시맨틱 레이어(→ `02_metrics_skills` §2)에 정의되지 않은 지표 임의 계산·표시
- ❌ 시각화 매트릭스(→ `03_visualization_skills` §3.1) 위반 (예: 12자산 도넛)
- ❌ BUILD 5단계 일부 생략 (Quick 모드 제외)
- ❌ 환각 데이터 (입력에 없는 자산·기간·이벤트 언급)
- ❌ 단정 미래 전망 ("반드시 오를 것" 등)
- ❌ 무위험 자산 명백 열위 결과를 "양호" 포장
- ❌ 자산군별 임계(→ `02_metrics_skills` §2.4.1) 무시한 단일 임계 적용
- ❌ audience 화이트리스트 외 지표·차트·톤 노출 (단, §0.3.1 트리거 예외)
- ❌ `audience`를 데이터 복잡도로 자동 추정

### 0.5.2 필수 포함

- ✅ 모든 지표에 계산 기간 명시
- ✅ 모든 차트에 데이터 출처·기준일
- ✅ 면책 조항: "본 분석은 정보 제공 목적이며 투자 자문이 아닙니다."
- ✅ 통계적 유의성 경고 (n < 30 등)
- ✅ `meta.mode`·`meta.audience` 명시
- ✅ `[ref: metric=, period=, n=]` 추적성 모든 인사이트 부착
- ✅ `meta.conflict_resolution` 충돌 해소 적용 시 기록

### 0.5.3 버전 관리

- SemVer (지표·타입 변경=메이저, 임계·구조 추가=마이너, 문구=패치)
- 변경 이력은 `CHANGELOG.md` 단일 소스
- 버전 변경 시 캐시 전체 무효 (→ `05_contract_skills` §6.3)

### 0.5.4 자동 검증 케이스

`examples/` 디렉토리에 5개 골든 케이스 (입력 CSV → 기대 출력 JSON). 명세 수정 시 골든 출력과 diff 검증.

\newpage

# 01. Data Skills

> 어떤 형태(CSV, JSON, XBRL, 거래내역)의 입력 데이터든 표준 스키마로 변환하고 검증한다. 변환 실패 시 다음 단계 진입을 차단한다.

## 1.1 표준 입력 스키마

본 스킬은 **거래내역(transactions)** 과 **잔고(portfolio holdings)** 를 모두 1차 입력으로 인정한다. 거래내역만 있으면 §1.2 변환 규칙으로 잔고를 산출.

```yaml
asset:
  asset_id: string                  # "AAPL", "005930.KS"
  asset_name: string
  asset_class: enum                 # [equity, etf, fund, bond, crypto, commodity]
  sector: string                    # GICS 11개 또는 KRX 33개 분류, 미매핑 시 N/A
  base_currency: string             # ISO-4217

timeseries:
  timestamp: string                 # ISO-8601 UTC, 나노초 보존
  asset_id: string
  open, high, low: number
  close: number                     # 필수
  volume: number | null
  adjusted_close: number            # 배당·분할 조정, 수익률 계산 우선

transactions:                       # 매수/매도 이벤트 시계열
  transaction_id: string
  asset_id: string
  side: enum                        # [buy, sell, dividend, split, fee, deposit, withdrawal]
  quantity: number
  price: number                     # 거래 단가 (base_currency)
  fees: number                      # 수수료 + 세금
  executed_at: string               # ISO-8601
  tax_treatment: enum               # [pre_tax, post_tax, tax_free]

portfolio:                          # 잔고 (현재 시점 스냅샷)
  position_id: string
  asset_id: string
  quantity: number
  avg_cost: number                  # 평단가
  weight: number                    # 0.0~1.0, 합계 1.0 ± 0.001
  acquired_at: string

analysis_config:                    # 사용자 설정 일괄 관리
  base_currency: string             # 기본 USD
  risk_profile: enum                # [conservative, moderate, aggressive], 기본 moderate
  audience: enum                    # [novice, intermediate, expert], 기본 intermediate
  benchmark_id: string | null       # 미지정 시 → 02_metrics_skills §2.4
  analysis_period: { start: string, end: string } | null
  cost_basis_method: enum           # [moving_avg, fifo, lifo], 기본 moving_avg
  locale: enum                      # [ko-KR, en-US, auto], 기본 auto
```

## 1.2 정규화 강제 규칙

### 1.2.1 기본 정책

- **타임스탬프**: ISO-8601 UTC 강제, 나노초 보존, 타임존 없는 입력 거부.
- **통화 정규화**: 다중 통화 시 `analysis_config.base_currency`로 거래 timestamp 당일 종가 환율 환산. 환차손익 별도 분리 보고.
- **결측치**: 가격 결측 → 직전 영업일 forward-fill (≤ 3영업일). 4영업일 이상 → 자산 제외 + warnings 기록.
- **이상치**: 일일 수익률 ±50% 초과 시 split/merge 의심 플래그, `adjusted_close` 재검증.
- **XBRL 확장**: 표준 외 개념은 가장 가까운 표준에 매핑 + confidence score 0~1 부여.

### 1.2.2 거래내역 → 잔고 변환

거래내역만 입력될 경우 §1.1 portfolio 산출:

- `quantity = Σ(buy.qty) - Σ(sell.qty) + Σ(split·dividend 조정량)`
- `avg_cost`: `analysis_config.cost_basis_method` 따름:
  - `moving_avg` (기본): `Σ(buy.qty × buy.price + buy.fees) / Σ(buy.qty)`
  - `fifo`: 매도 시 가장 오래된 매수분부터 차감, 잔존분 평단가
  - `lifo`: 매도 시 가장 최근 매수분부터 차감, 잔존분 평단가
- `weight = (quantity × current_close) / portfolio_market_value`
- `acquired_at = min(buy.executed_at)`
- 변환 결과는 `warnings`에 "거래내역 기반 산출, 평단가는 {method}법" 명시

### 1.2.3 자산 이벤트 처리 정책

| 이벤트 | side | 처리 |
|---|---|---|
| **현금 배당** | `dividend` | quantity 변동 없음, `pre_tax` 배당수익률에 가산. 세후 처리는 `tax_treatment` 따름 |
| **주식 분할 N:1** | `split` | quantity × N, avg_cost ÷ N. timeseries는 `adjusted_close` 사용 |
| **합병·교환** | `split` (재해석) | 신주 자산을 `transactions`에 새 매수로 자동 생성 |
| **매도 fees** | `sell` 행에 `fees` | cost basis에 영향 없음. 실현 손익에서 차감 → 세후 수익률 |
| **매수 fees** | `buy` 행에 `fees` | cost basis에 가산 (§1.2.2 공식) |
| **환율 변동** | — | 외화 자산은 매 평가 시점에 환율 재평가, 환차손익 분리 보고 |

### 1.2.4 세후/세전 분리

`transactions.tax_treatment`별로 수익률을 분리 산출하고 출력에 `pre_tax_return`, `post_tax_return` 동시 노출 (→ `05_contract_skills` §6.1 `SemanticMetrics.returns`).

## 1.3 검증 게이트

다음 검증을 **모두** 통과해야 다음 단계 진행:

- [ ] 필수 필드(`asset_id`, `timestamp`, `close`) null 아님
- [ ] `weight` 합계 1.0 ± 0.001
- [ ] `timestamp` strictly monotonic
- [ ] `base_currency` ISO-4217 유효
- [ ] (거래내역 입력 시) 모든 매도 수량 ≤ 누적 매수 수량 (음수 보유 방지)
- [ ] `analysis_config.audience` 유효 enum 또는 미지정

검증 실패 시 처리 중단 + 구체 위반 항목을 사용자에게 반환.

## 1.4 입력 어댑터 (Input Adapters)

기획서 §5 시연 1·2 보장. 입력 컬럼 헤더가 표준 스키마와 다를 때 자동 매핑.

### 1.4.1 자동 컬럼 매핑 사전

| 표준 필드 | 한국어 후보 | 영어 후보 |
|---|---|---|
| `asset_id` | 종목코드, 티커, 코드, 심볼 | ticker, symbol, code, isin |
| `asset_name` | 종목명, 종목, 이름 | name, asset, security |
| `asset_class` | 자산구분, 자산종류, 분류 | class, type, asset_type |
| `sector` | 섹터, 업종, 산업 | sector, industry |
| `quantity` | 수량, 보유수량, 주식수, 보유량 | qty, shares, units, holdings |
| `avg_cost` | 평단가, 매입가, 평균매입가, 매수단가 | avg_price, cost_basis, avg_cost |
| `price` | 단가, 매매단가, 체결가 | price, exec_price |
| `fees` | 수수료, 거래비용, 수수료세금 | fees, commission, costs |
| `executed_at` | 거래일, 매매일자, 일자, 체결일 | trade_date, execution_date, exec_date |
| `side` | 구분, 매매구분, 거래구분, 매수매도 | type, action, side |
| `tax_treatment` | 세제구분, 과세 | tax, tax_treatment |
| `base_currency` | 통화, 결제통화 | currency, ccy |

### 1.4.2 매핑 알고리즘

1. **정확 매치** (대소문자 무시, 공백·특수문자 제거 후): 신뢰도 1.0
2. **부분 포함 매치**: 신뢰도 0.85
3. **편집 거리** (Levenshtein ≤ 2): 신뢰도 0.6~0.8
4. **의미 임베딩** (LLM 보조): 신뢰도 0.5~0.9

신뢰도 < 0.8이면 사용자 확인 요청. 매핑 결과는 `warnings`에 기록.

### 1.4.3 다중 포트폴리오 병합 정책 (시연 2 보장)

- 동일 사용자의 추가 업로드 시 **기본은 별도 포트폴리오 비교 모드**.
- 사용자가 `merge: true` 지시 시 합산 (자산별 weight 재계산, 통화 다르면 base_currency 일괄 환산).
- 병합 결과는 `meta.portfolios: PortfolioMeta[]` 배열로 노출 (→ `05_contract_skills` §6.1).

\newpage

# 02. Metrics Skills

> 표준 공식으로 위험·수익 지표를 계산하고, 자산군별 통계 특성에 맞게 해석하며, audience(novice/intermediate/expert)별로 노출 지표를 분기한다.

## 2.1 시맨틱 레이어 원칙

본 모듈의 모든 지표는 **Single Source of Truth**.
- 차트·인사이트·리포트는 본 모듈 외 정의로 지표 재계산 금지.
- 지표 정의 변경 시 `version` 갱신 필수 (메이저 변경 → CHANGELOG.md).

## 2.2 수익률 지표

| 지표 | 수식 | 적용 조건 | 주의 |
|---|---|---|---|
| **단순 수익률** | `R_t = (P_t - P_{t-1}) / P_{t-1}` | 횡단면 가중 합산 | 시계열 누적 금지 |
| **로그 수익률** | `r_t = ln(P_t / P_{t-1})` | 시계열 누적·복리 (기본값) | 횡단면 가중 합산 금지 |
| **누적 수익률** | `Π(1+R_t) - 1` 또는 `Σr_t` | 기간 전체 성과 | 두 방식 혼용 금지 |
| **CAGR** | `(P_end/P_start)^(1/years) - 1` | 1년 이상 장기 | 산술평균 대체 시 과대추정 |

**기본값**: 시계열은 로그, 포트폴리오 일별은 단순 후 누적 시 로그 변환.

세후/세전 수익률은 `→ 01_data_skills §1.2.4`에 따라 분리 산출.

## 2.3 위험·위험 조정 성과 지표

| 지표 | 수식 | 측정 대상 | 임계값 해석 |
|---|---|---|---|
| **표준편차** (σ) | `√(Σ(r-r̄)²/(n-1))` × √252 | 총 변동성 | §2.4.1 자산군별 |
| **하방편차** | `√(Σmin(r-MAR,0)²/n)` | 하방 위험 | MAR 기본 = Rf |
| **VaR 95%** | `-percentile(returns, 5)` × portfolio_value | 95% 신뢰 손실 한계 | 일별·주별·연환산 산출 |
| **CVaR 95%** | `-E[R \| R ≤ -VaR_95]` × portfolio_value | VaR 초과 영역 평균 손실 | 꼬리 위험 표준 |
| **샤프 비율** | `(Rp - Rf) / σp` | 총 위험당 초과수익 | §2.4.1 자산군별 |
| **소르티노 비율** | `(Rp - Rf) / 하방편차` | 하방 위험당 초과수익 | 방어적 운용 평가 |
| **트레이너 비율** | `(Rp - Rf) / β` | 체계적 위험당 초과수익 | β < 0.1 시 N/A |
| **칼마 비율** | `CAGR / \|MDD\|` | 낙폭 회복력 | §2.4.1 자산군별 |
| **정보 비율** | `Active Return / Tracking Error` | 액티브 운용 효율 | < 0.5 권고 미달 |
| **알파** (Jensen) | `Rp - [Rf + β(Rm-Rf)]` | 매니저 부가가치 | 양수 = 초과 |
| **베타** | `Cov(Rp,Rm) / Var(Rm)` | 시장 민감도 | §2.4.1 자산군별 |
| **MDD** | `min((P_t - 누적최고가)/누적최고가)` | 최대 낙폭 | §2.4.1 자산군별 |
| **회복 기간** | `MDD 시점 → 직전 최고가 회복까지 영업일` | 낙폭 지속성 | > 252영업일 시 "장기 침체" 경고 |
| **R²** | `(상관계수)²` | 벤치마크 설명력 | < 0.7 시 베타 해석 주의 |

## 2.4 기본 파라미터

```yaml
risk_free_rate: 0.04              # 4%, 사용자 오버라이드 가능
trading_days_per_year: 252
benchmark_default:
  US: SPY
  KR: KODEX 200
  Global: ACWI
mar_default: 0.04
var_confidence: 0.95
recovery_warning_days: 252
```

`risk_profile`은 `→ 01_data_skills §1.1 analysis_config`로 입력받음.

## 2.4.1 자산군별 차등 임계값

지표 임계는 자산군 통계 특성에 따라 다르게 해석. 단일 임계는 채권 위험을 과대평가하고 암호자산 위험을 과소평가하므로 강제 차등.

| 임계값 | equity | etf | bond | crypto | commodity | 가이드 |
|---|---|---|---|---|---|---|
| 연환산 σ "정상" | 15~25% | 10~20% | 3~8% | 60~120% | 20~35% | 범위 초과 시 §5.2 경고 |
| MDD "주의" | -20% | -15% | -10% | -50% | -30% | 자본 잠식 경고 |
| 베타 "고변동" | > 1.3 | > 1.2 | > 0.5 | > 1.5 | > 1.2 | 자산군 시장 베타 |
| 샤프 "양호" | ≥ 1.0 | ≥ 0.8 | ≥ 0.4 | ≥ 1.5 | ≥ 0.6 | 자산군별 |
| 칼마 "양호" | ≥ 0.5 | ≥ 0.4 | ≥ 0.2 | ≥ 0.7 | ≥ 0.3 | CAGR/\|MDD\| |
| CVaR 95% "주의" (일별) | -3% | -2% | -1% | -10% | -4% | 꼬리 위험 |
| 단일 자산 집중 | > 30% | > 40% | > 50% | > 15% | > 20% | 분산 권고 |

**적용 규칙**:
- 다자산 혼재 시 가중평균: `threshold_portfolio = Σ(weight_i × threshold_class_i)`
- 자산군 불명확 시 가장 보수적(가장 엄격) 임계 적용
- `risk_profile`로 ±20% 조정: `conservative` -20%, `moderate` 표준, `aggressive` +20%
- 충족 여부는 `RiskMetrics.asset_class_thresholds`에 `info | warn | critical` 기록

## 2.5 계산 가드레일

- 표본 < 30 → "낮은 통계적 유의성" 플래그
- β 계산 시 R² < 0.5 → 결과 유보, 벤치마크 재검토 요청
- 분모 0 수렴 지표(트레이너 β, 샤프 σ) → N/A, 무한대 표시 금지
- 환산 시 `trading_days_per_year` 외 임의 연환산 금지

## 2.6 audience 노출 정책

기획서 §1 타겟 "초보 투자자"가 트레이너 비율·정보 비율을 보면 압도된다. audience별 노출 화이트리스트:

| audience | 노출 KPI | 노출 차트 | 인사이트 톤 |
|---|---|---|---|
| **novice** | 총 수익률, MDD, 변동성, 자산 비중 | line, donut, big_number_sparkline, underwater | "신호등 비유" + 용어 사전 강제 (→ `04_report_skills` §4.7) |
| **intermediate** (기본) | + 샤프, 소르티노, 베타, CAGR, 칼마 | + treemap, multi_line, heatmap, bubble | 핵심 지표 + 간략 해석 |
| **expert** | 모든 §2.3 지표 | 모든 차트 | 방법론·통계적 한계 노출 |

### 2.6.1 audience 결정 우선순위

`audience`는 **사용자 지식 수준**의 함수이지 데이터 복잡도가 아니다 (→ `00_core_skills` §0.3). 결정 우선순위:

1. `analysis_config.audience` 명시 → 우선
2. `→ 00_core_skills §0.4.3` audience 분기 키워드
3. UI 명시 선택
4. 기본값 **intermediate**

> ❌ 데이터 복잡도(자산 수·기간 등)로 audience 자동 추정 **금지**.

### 2.6.2 audience × mode × 트리거 충돌

`→ 00_core_skills §0.3.1` 매트릭스 따름. 핵심:
- 모드 vs audience 충돌 → audience 우선 (사용자 친화)
- §5.2 트리거 vs audience 화이트리스트 충돌 → 트리거 우선 + 근거 KPI 임시 노출

\newpage

# 03. Visualization Skills

> 분석 목적과 데이터 형태에 따라 **기계적으로** 차트를 선택한다. 미학적 선호로 매트릭스 위반 금지.

## 3.1 차트 선택 매트릭스

| 분석 목적 | 데이터 형태 | 선택 차트 | 핵심 인코딩 |
|---|---|---|---|
| 시계열 가격 추적 | OHLC 보유 | **캔들스틱** | 상승=녹/하락=적, 거래량 보조축 |
| 시계열 가격 추적 | 종가만 | **라인** | 단일 색, 2px |
| 다자산 시계열 비교 | 2~7개 | **다중 라인** | 시작값 100 정규화 (rebase) |
| 다자산 시계열 비교 | 8개 이상 | **소형 다중** (Small Multiples) | 동일 y축 강제 |
| 자산 간 상관관계 | 상관 행렬 | **히트맵** | 발산형(-1청/0백/+1적), \|r\|≥0.8 주석 |
| 상관관계 시간 변화 | 다기간 상관 행렬 | **상관 진화 라인** | 시점별 평균 상관, 위기 시점 어노테이션 |
| 포트폴리오 구성 | ≤5개 | **도넛** | 5% 미만 "기타" 통합 |
| 포트폴리오 구성 | ≥6개 / 계층 | **트리맵** | 면적=비중, 색=수익률 |
| 손익 변화 동인 | 변동 분해 | **워터폴** | 양=녹/음=적/합=청 |
| 요인 기여도 | 시장/종목/타이밍 분해 | **요인 워터폴** | 요인별 색상 분리 |
| 단순 비교·랭킹 | ≤15개 | **수평 바** | 값 내림차순 |
| 분포·이상치 | 수익률 분포 | **히스토그램+박스** | 정규분포 보조선 |
| 드로다운 분포 | 모든 드로다운 사건 | **히스토그램** | x=낙폭 깊이, y=빈도, p95 어노테이션 |
| 위험-수익 산점 | 다자산 비교 | **버블** | x=σ, y=수익, 크기=AUM |
| 효율적 프런티어 | 위험-수익 곡선 | **산점+곡선** | 현 포지션 마커, 프런티어 곡선 |
| 단일 KPI 강조 | 핵심 1개 | **빅넘버+스파크라인** | 전기 대비 색상 |
| MDD 추적 | 시계열 낙폭 | **언더워터** | 0 baseline 음수 영역 |
| 롤링 윈도우 지표 | 30/90일 롤링 샤프·변동성 | **롤링 라인** | 시간축 + 윈도우 크기 어노테이션 |

## 3.2 색상 거버넌스

대시보드 전체에서 색상 의미는 **절대 일관성** 유지.

```yaml
semantic_colors:
  positive: "#16A34A"     # 수익, 상승, 양호
  negative: "#DC2626"     # 손실, 하락, 경고
  neutral:  "#64748B"     # 변동 없음, 무관
  primary:  "#2563EB"     # 주 데이터, 포트폴리오
  benchmark: "#94A3B8"    # 벤치마크 (항상 회색조)
  warning:  "#F59E0B"     # 임계치 근접
  critical: "#991B1B"     # 임계치 초과
```

색상에만 의미 부여 금지, 항상 아이콘·레이블 보조 사용 (색맹 접근성).
색상 토큰은 사용 라이브러리(§3.4) 무관하게 동일 적용.

## 3.3 레이아웃 (Z-Layout 강제)

```
┌─────────────────────────────────────────────────────┐
│ [1] KPI 요약  →  [2] 핵심 알림                       │  ← Z 시작
├─────────────────────────────────────────────────────┤
│ [3] 메인 시계열 (전체 너비)                          │
├──────────────────────┬──────────────────────────────┤
│ [4] 포트폴리오 구성   │ [5] 위험 지표 패널            │
├──────────────────────┴──────────────────────────────┤
│ [6] 상세 테이블 / 드릴다운                           │  ← Z 종료
└─────────────────────────────────────────────────────┘
```

- 상단 30% KPI / 중단 40% 메인 / 하단 30% 드릴다운
- 한 화면 6~8개 차트 상한 (Progressive Disclosure)
- 차트 간 패딩 24px 이상, 격자선·진한 테두리 금지
- **이중 축 차트 금지** — 허위 상관관계 암시. 분리 차트 두 개로 대체
- **절단된 축 금지** — 막대·영역 y축은 0부터. 시계열 라인은 예외 허용

### 3.3.1 audience별 레이아웃 적용

`→ 02_metrics_skills §2.6` 화이트리스트 따라 차트 노출:
- novice → [1][3][4] 위주, 5·6 생략 가능
- intermediate (기본) → [1]~[5]
- expert → [1]~[6] 전체 + 부속 분석 차트

audience-mode 충돌 시 `→ 00_core_skills §0.3.1` 우선순위 적용.

## 3.4 차트 → 라이브러리 매핑

본 매핑은 권고이며, 동일 시각적 결과를 다른 라이브러리로 대체해도 명세 위반이 아니다.

| ChartSpec.type | 1순위 | 2순위 | 비고 |
|---|---|---|---|
| `candlestick` | Plotly (`Candlestick`) | Recharts custom | 거래량 보조축 내장 |
| `line` / `multi_line` | Recharts (`LineChart`) | Plotly | 인터랙션 가벼움 |
| `small_multiples` | D3 + Recharts grid | Plotly subplot | ≥8 시계열 |
| `heatmap` / `correlation_evolution` | Plotly (`Heatmap`) | D3 | 발산형 컬러스케일 |
| `donut` | Recharts (`PieChart` + innerRadius) | Plotly | ≤5 자산 |
| `treemap` | Recharts (`Treemap`) | D3 | 면적·색상 매핑 |
| `waterfall` / `factor_attribution` | Plotly (`Waterfall`) | Recharts custom | 양/음/합계 색상 분리 |
| `horizontal_bar` | Recharts (`BarChart` layout="vertical") | Plotly | 카테고리 정렬 |
| `histogram_box` / `drawdown_dist` | Plotly (`Histogram`+`Box`) | D3 | 분포·정규분포 보조선 |
| `bubble` / `efficient_frontier` | Recharts (`ScatterChart`) | Plotly | 위험-수익 산점 |
| `big_number_sparkline` | 자체 컴포넌트 + Recharts mini line | — | KPI 패널 |
| `underwater` | Recharts area + 0 baseline | Plotly | MDD 추적 |
| `rolling_window` | Recharts | Plotly | 윈도우 어노테이션 |

### 3.4.1 라이브러리 선택 원칙

- **기본 라이브러리는 Recharts** — React 친화·번들 사이즈 작음·SSR 호환
- **Plotly로 전환** — 캔들스틱·히트맵·워터폴·히스토그램 박스플롯 등 통계·금융 전용 차트
- **D3로 전환** — 소형 다중 차트, 트리맵 커스텀, 발산형 색상 보간 등 세밀 제어
- 한 대시보드 내 라이브러리 혼용 허용. 단 §3.2 색상 토큰은 모든 라이브러리 동일 적용.

## 3.5 차트 메타데이터 필수 항목

모든 차트는 `→ 05_contract_skills §6.1 ChartSpec`을 따르며 다음 필수:

- `source`: "Yahoo Finance / 2026-04-30 종가" 형식 데이터 출처·기준일
- `caveat`: 통계 유의성 부족 시 "표본 < 30, 통계 보통" 등
- `encoding.color_map`: §3.2 시맨틱 컬러 키 사용
- `annotations`: 위기 시점·임계 초과 시점은 어노테이션으로 표시

\newpage

# 04. Report Skills

> 지표·차트를 BUILD 5단 구조로 조립하고, 임계 트리거에 따라 인사이트를 자동 생성한다. audience별 톤을 적용한다.

## 4.1 BUILD 프레임워크 강제 헤더 구조

모든 분석 리포트 출력은 **반드시 5단계 마크다운 헤더 구조**를 따른다. 단계 생략·순서 변경 금지. (단, Quick 모드는 BUILD 전체 생략.)

```markdown
### 📌 요약 (Begin with the End in Mind)
- BLUF: 핵심 결론 1~2문장 + 즉각 행동
- 핵심 KPI 3개

### 🌐 거시 경제 맥락 (Understand the Context)
- 분석 기간 시장 환경
- 벤치마크 대비 성과 (절대·상대)
- 외부 이벤트(금리·환율·거시지표) 연관성

### 💡 성과 동인 (Illustrate Insights)
- 긍정 기여 상위 3개 (기여도 %)
- 부정 기여 상위 3개
- 핵심 시각화 1개 앵커 배치 (anchor_chart_id)

### ⚠️ 위험 지표 및 의미 (Link Data to Implications)
- 하방 중심 (MDD, 하방편차, 소르티노, CVaR, 회복 기간)
- "So What?" 비즈니스적 함의
- 시나리오 분석 (낙관/기준/비관)

### ✅ 권고 사항 (Drive Action)
- 액션 아이템 (자산·비중·시점 명시)
- 책임자·데드라인 (있는 경우)
- 모니터링 후속 지표
```

## 4.2 섹션별 데이터 플레이스홀더

```yaml
B_section: { bluf_statement, top_kpi_1~3 }
U_section: { market_regime, benchmark_performance: { absolute, relative, attribution } }
I_section: { top_contributors, top_detractors, anchor_chart_id }
L_section: { risk_metrics: { mdd, cvar_95, sortino, recovery_days, ... }, scenarios }
D_section: { action_items, monitoring_kpis }
```

## 4.3 인사이트 생성 원칙 (NLG)

- **숫자 나열 금지** — "수익률 5%"가 아니라 "벤치마크 대비 2%p 초과 성과로 종목 선택이 시장 타이밍보다 효과적"
- **인과 3단** — 원인(What drove) → 결과(So what) → 함의(Now what)
- **추적성 강제** — 모든 인사이트 끝에 `[ref: metric=, period=, n=]` 부착
- **환각 방지** — `→ 02_metrics_skills` 외 지표 생성·언급 금지
- **편향 회피** — 단정 미래 전망 금지, "조건 X 유지 시 Y 시나리오 확률↑" 형태 조건부 진술

## 4.4 임계값 기반 자동 경고 트리거

다음 조건 충족 시 **자동으로 해당 코멘트를 리포트에 삽입**한다. 임계는 `→ 02_metrics_skills §2.4.1` 자산군별 차등 우선 적용.

| 트리거 조건 | 자동 생성 인사이트 |
|---|---|
| MDD > 자산군 "주의" 임계 | ⚠️ "최대낙폭이 자산군 임계 초과, 자본 잠식 리스크 확대. 방어 자산 5~10%p 상향 권고." |
| 회복 기간 > 252영업일 | ⏳ "1년 이상 장기 침체 진행. 손실 방치 비용 vs 손절 비교 검토." |
| CVaR 95% > 자산군 임계 | 💥 "꼬리 위험이 자산군 일반 수준 초과. 극단적 시장 충격 시 평균 손실폭 확대 예상." |
| 샤프 ≥ 2.0 | ⚡ "샤프 2.0 이상은 통상 레버리지·비정규 분포 동반. 꼬리 위험 점검." |
| 샤프 < 0 | 🔻 "위험 조정 성과 무위험 열위. 알파 창출 능력 재검토." |
| 칼마 < 자산군 양호 | 📉 "낙폭 회복력 자산군 일반 수준 미달. 진입 시점 재고 권고." |
| 단일 자산 > 자산군 집중 임계 | 🎯 "집중 리스크: 자산군별 분산 권고 초과. 리밸런싱 권고." |
| 상관 > 0.8 자산쌍 ≥ 3 | 🔗 "다수 자산 고상관, 분산 효과 명목상. 비상관 자산 편입 검토." |
| 베타 > 자산군 "고변동" | 📈 "자산군 시장 대비 고변동. 약세장 손실 비례 확대." |
| 정보 비율 < 0.5 | 💼 "벤치마크 추종 효율 저하. 액티브 부가가치 추적 오차 미정당화." |
| R² < 0.5 | 📊 "포트폴리오 ↔ 벤치마크 구조적 상이. 적합 벤치마크 재선정 검토." |

### 4.4.1 트리거 vs audience 화이트리스트 충돌

audience 화이트리스트(→ `02_metrics_skills` §2.6)에 없는 KPI에 트리거가 발동되는 경우:
- **트리거 우선**: 인사이트 삽입 + 근거 KPI를 임시 노출 (검증 가능성 보장)
- 적용 결과는 `meta.conflict_resolution`(→ `05_contract_skills` §6.1)에 기록
- 상세 우선순위: `→ 00_core_skills §0.3.1`

## 4.5 인사이트 출력 포맷

```markdown
**[심각도 아이콘] [제목]**
- **무엇이 발견되었나**: {observation} `[ref: metric=, period=, n=]`
- **왜 중요한가**: {implication}
- **권장 행동**: {recommended_action}
- **모니터링 지표**: {follow_up_metrics}
```

심각도 아이콘 enum: `⚠️ | ⚡ | 🔻 | 🎯 | 🔗 | 📈 | 💥 | ⏳ | 📉 | 💼 | 📊` — `→ 05_contract_skills §6.1 InsightIcon` literal 타입.

## 4.6 톤 & 매너 (audience 분기)

- **객관적·전문적** — 감탄사·과장 형용사 금지
- **간결성** — 1 인사이트 4문장 이내
- **audience 적응**:
  - **novice** → §4.7 용어 사전 강제 적용, 신호등 비유, 친근한 톤
  - **intermediate** (기본) → 핵심 지표 + 간략 해석, 중립적 톤
  - **expert** → 방법론·통계적 한계 노출, 전문 용어 그대로

언어는 `analysis_config.locale` 따름. `auto`이면 입력 데이터·KPI 라벨 언어로 추정.

## 4.7 초보자 용어 사전

novice audience에서는 다음 매핑을 **강제 적용**한다:

| 전문 용어 | 초보자용 풀이 | 비유 |
|---|---|---|
| MDD (Max Drawdown) | 최대 낙폭 — 자산이 가장 많이 떨어졌을 때의 폭 | "산 정상에서 골짜기까지의 깊이" |
| 변동성 (Volatility) | 가격이 출렁이는 정도 | "파도의 높이" |
| 샤프 비율 | 같은 위험을 졌을 때 얼마나 수익을 더 냈는지 | "비싼 입장료 낸 만큼 즐거웠는가" |
| 베타 | 시장이 1% 움직일 때 내 자산이 몇 % 움직이는지 | "시장 따라가기 민감도" |
| MAR | 최소한 이 정도는 벌어야 만족 (기본 4%) | "통과 기준선" |
| VaR 95% | 100일 중 95일은 이보다 덜 잃는다 | "최악의 5% 제외 손실 한계" |
| CVaR 95% | 그 최악의 5% 영역 평균 손실 | "재난급 시나리오 평균 피해" |
| 상관계수 | 두 자산이 같이 움직이는 정도 (-1~+1) | "쌍둥이 vs 무관한 사람" |
| 회복 기간 | 손실에서 본전 회복까지 걸린 날짜 | "낙상 후 재활 기간" |
| 칼마 비율 | 큰 낙폭을 감수하고 얻은 연수익 효율 | "고통 대비 보상" |
| 트레이너 비율 | 시장과 함께 움직인 위험 대비 초과 수익 | "필수 위험만 졌을 때의 보상" |
| 정보 비율 | 벤치마크보다 얼마나 안정적으로 더 벌었는가 | "꾸준한 추월 운전" |
| 알파 | 시장 흐름 외 매니저 실력으로 더 번 수익 | "운이 아닌 실력 부분" |

intermediate에서는 본 사전 미적용 (전문 용어 그대로). expert에서는 영어 용어와 수식 병기.

\newpage

# 05. Contract Skills

> 프론트엔드가 받아 렌더링할 JSON 구조와 캐시·핫리로드 정책을 정의한다. 본 모듈이 백엔드-프론트 인터페이스의 단일 진실 원천.

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
    conflict_resolution?: {
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
  semantic_color: ValueDirection;    // 값 방향성만
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
  deadline?: string;
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

interface BenchmarkComparison {      // tracking_error 단일 위치
  benchmark_id: string;
  absolute_return: number;
  relative_return: number;
  tracking_error: number;
  attribution: Attribution[];
}

interface SemanticMetrics {
  returns: {
    simple: number; log: number; cumulative: number; cagr: number;
    pre_tax?: number; post_tax?: number;
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

## 6.2 모드별 필드 채움 규칙

| 필드 | Quick | Standard | Full |
|---|---|---|---|
| `meta` | ✅ | ✅ | ✅ |
| `kpis` | 1개 (질의 지표) | 3~5개 | 모든 핵심 KPI |
| `charts` | `[]` | 3~4개 | 6~8개 |
| `report` | 생략 | 5단 요약 | 5단 전체 |
| `insights` | §4.4 트리거 1개 | 트리거 모두 | 트리거 + 비조건부 |
| `raw_metrics` | 질의 지표만 | 전체 | 전체 |

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
| `02_metrics_skills §2` 시맨틱 변경 | KPI · report · raw_metrics 전체 재계산 |
| `02_metrics_skills §2.4.1` 임계 변경 | insights · `RiskMetrics.asset_class_thresholds`만 |
| `03_visualization_skills §3.1` 매트릭스 변경 | charts만 재렌더 |
| `04_report_skills §4.7` 용어 사전 변경 | novice audience 출력 텍스트만 |
| `00_core_skills §0.3.1` 충돌 해소 변경 | 충돌 발생 케이스만 |

핫리로드 시 `meta.cache_key` + `meta.invalidated: ["insights", ...]` 명시.

## 6.4 E2E 검증 사례

### 6.4.1 Standard 모드 (다자산 혼재)

**입력 CSV** (`examples/03_multi_asset.csv` 발췌):

| asset_id | asset_class | quantity | avg_cost | acquired_at |
|---|---|---|---|---|
| 005930.KS | equity | 50 | 72000 | 2025-03-12 |
| QQQ | etf | 10 | 480.50 | 2025-06-01 |
| BTC-USD | crypto | 0.05 | 65000 | 2025-09-20 |
| KR1Y_BOND | bond | 100 | 98.5 | 2025-01-15 |

**출력 (요약)**:

- `meta.mode = "standard"`, `meta.audience = "intermediate"` 자동 결정
- BTC 비중 22%가 equity 임계 30% 미달이지만 **crypto 임계 15% 초과** → `RiskMetrics.asset_class_thresholds.crypto = "critical"`
- 인사이트: 🎯 "BTC 자산군 집중 경고" (BTC 22% > crypto 임계 15%)
- BUILD-D 액션: `{ action: "trim", asset_id: "BTC-USD", target_weight: 0.10, rationale: "→ 02_metrics_skills §2.4.1 crypto 단일 자산 집중 임계 초과" }`
- 모든 인사이트에 `[ref: metric=concentration, period=2026-04-30, n=1]` 추적성 부착

전체 페이로드는 `examples/03_multi_asset.output.json` 참조.

### 6.4.2 검증 포인트

- `mode`·`audience` 명시 → 프론트 렌더 분기 + 톤 분기
- `RiskMetrics`에 VaR·CVaR·Calmar·recovery_days 동시 노출
- `Severity` enum 통일 (`info`·`warn`·`critical`)
- `tracking_error`·`sortino` 단일 정의 (중복 제거 검증)
- BTC 22%가 equity 임계 30% 미달이나 crypto 15% 초과 — 자산군별 차등 효과
- `KPI.semantic_color`는 값 방향성만, `severity`는 별도 차원 — 색상 매핑 단순화

\newpage

# 변경 이력

## [3.0.0] — 2026-05-07 (역할별 6모듈 분할)

### Structure (BREAKING)
단일 `skills_v2.md` 789라인을 역할별 6개 파일 + INDEX로 분할:
- `00_core_skills.md` — 진입점·파이프라인·전역 가드레일·트리거 키워드
- `01_data_skills.md` — 정규화·거래내역 변환·입력 어댑터·병합
- `02_metrics_skills.md` — 시맨틱 레이어·자산군별 임계·audience 정책
- `03_visualization_skills.md` — 차트 매트릭스·색상·레이아웃·라이브러리
- `04_report_skills.md` — BUILD·NLG·트리거·초보자 용어 사전
- `05_contract_skills.md` — 출력 계약·모드별 채움·캐시·E2E
- `INDEX.md` — 모듈 지도·의존 그래프·빠른 참조

### Added
- `00 §0.3.1` audience × mode × 트리거 충돌 해소 매트릭스
- `01 §1.2.3` 자산 이벤트 처리 정책 (dividend/split/매도 fees/환율)
- `01 §1.1 analysis_config.cost_basis_method` (FIFO/LIFO/이동평균 선택)
- `01 §1.1 analysis_config.locale` (ko-KR/en-US/auto)
- `01 §1.4.2` 매핑 알고리즘 (정확/부분/Levenshtein/임베딩 4단계 신뢰도)
- `04 §4.7` 초보자 용어 사전 3개 추가 (트레이너·정보 비율·알파)
- `05 §6.1` named type 추출 (`AssetClass`, `Mode`, `Audience`, `RiskProfile`, `ChartType`, `InsightIcon`, `ValueDirection`)
- `05 §6.1 meta.conflict_resolution` 필드
- `05 §6.3.2` 캐시 stampede 방지 정책

### Changed (BREAKING)
- `version` 2.0.0 → 3.0.0
- `asset_class_thresholds`: `Record<string, Severity>` → `Partial<Record<AssetClass, Severity>>`
- `KPI.semantic_color`: 7색 union → `ValueDirection` 3색 + `severity` 별도 필드
- `Insight.icon`: `string` → `InsightIcon` literal union 11종
- `meta.locale` 필드 추가 (필수)
- audience 자동 결정에서 "데이터 복잡도 추정" 로직 **제거** (차원 오류 수정)

## [2.0.0] — 2026-05-07 (`skills_v2.md`)

### Added
- §1.1 `transactions` 스키마 + `analysis_config` 블록
- §1.1 `sector` 필드에 KRX 33개 분류 지원
- §1.2 거래내역 → 잔고 변환 규칙 + 세후/세전 분리 보고
- §1.4 입력 어댑터 (자동 컬럼 매핑·다중 포트폴리오 병합)
- §2.3 위험 지표 4종: VaR, CVaR, 칼마, 회복 기간
- §2.4.1 자산군별 임계에 칼마·CVaR 행 추가
- §2.6 audience 노출 정책
- §3.1 차트 매트릭스 5종: rolling_window, efficient_frontier, drawdown_dist, factor_attribution, correlation_evolution
- §5.5 초보자 용어 사전 10개
- §6.1 ChartSpec / Insight / KPI 등 하위 타입 풀 정의
- §6.3 캐시·핫리로드 정책
- §9.1 E2E 샘플 입출력

### Changed
- 출력 계약 enum 통일 (`info | warn | critical`)
- `BenchmarkComparison.tracking_error` 단일 정의
- `RiskMetrics.sortino` 단일 정의 (중복 제거)

## [1.1.0] — 2026-05-07

### Added
- §0.5 Quick / Standard / Full 3단 출력 모드
- §2.4.1 자산군별 차등 임계값 표
- §3.4 차트 → 라이브러리 매핑
- §6.1 ChartSpec / Insight / KPI 등 하위 타입 풀 정의

## [1.0.0] — 2026-05-05

### Initial
- 9개 섹션 기본 명세 (파이프라인 → 정규화 → 시맨틱 → 시각화 → BUILD → NLG → 출력 → 가드레일 → 트리거)
- TypeScript 출력 인터페이스 최상위 정의
- 401라인, version 1.0.0

\newpage

# 부록 A — 골든 케이스 인덱스

`examples/` 디렉토리에 5개 입력 샘플 + 2개 기대 출력 JSON:

| 파일 | 시연 시나리오 | 검증 영역 |
|---|---|---|
| `01_kr_equity_simple.csv` | 시연 1: 국내 주식 단일 자산군 | 한국어 컬럼 헤더 자동 매핑, 단일 자산군 임계 |
| `02_global_etf.csv` | 시연 1·2: 해외 ETF 분산 | 다중 통화·영문 헤더 |
| `03_multi_asset.csv` | 시연 2: 주식+ETF+채권+암호 혼재 | 자산군별 차등 임계의 효과 검증 |
| `04_transactions.csv` | 거래내역 입력 | §1.2.2 거래내역 → 잔고 변환 + 세후/세전 분리 |
| `05_messy_input.csv` | 시연 1: 양식 엉망 입력 | §1.4 입력 어댑터 자동 매핑 + 결측치 처리 |
| `01_kr_equity_simple.output.json` | 골든 출력 | Standard 모드 출력 계약 검증 |
| `03_multi_asset.output.json` | 골든 출력 | Full report 5단 + audience 분기 검증 |

---

## 면책 조항

본 분석은 정보 제공 목적이며 투자 자문이 아닙니다. 모든 투자의 책임은 사용자 본인에게 있습니다.

**© 2026 Omni-Dash Team. Apache-2.0 License.**
