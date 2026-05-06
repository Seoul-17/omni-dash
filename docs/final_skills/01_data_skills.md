---
name: financial-dashboard-data
role: 데이터 정규화·입력 어댑터·다중 포트폴리오 병합
version: 3.0.0
license: Apache-2.0
applies_to: [stage-1]
depends_on: [00_core_skills.md]
loaded_when: 입력 데이터 처리·정규화 단계
---

# 01. Data Skills — 입력 정규화 규칙

> 어떤 형태(CSV, JSON, XBRL, 거래내역)의 입력 데이터든 표준 스키마로 변환하고 검증한다. 변환 실패 시 다음 단계 진입을 차단한다.
>
> **사전 조건**: `→ 00_core_skills.md` 로드 완료, `mode`·`audience` 결정됨.
> **다음 단계**: `→ 02_metrics_skills.md` 시맨틱 레이어.

---

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
  benchmark_id: string | null       # 미지정 시 → 02_metrics_skills.md §2.4
  analysis_period: { start: string, end: string } | null
  cost_basis_method: enum           # [moving_avg, fifo, lifo], 기본 moving_avg
  locale: enum                      # [ko-KR, en-US, auto], 기본 auto
```

---

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

### 1.2.3 자산 이벤트 처리 정책 (NEW v3.0.0)

| 이벤트 | side | 처리 |
|---|---|---|
| **현금 배당** | `dividend` | quantity 변동 없음, `pre_tax` 배당수익률에 가산. 세후 처리는 `tax_treatment` 따름 |
| **주식 분할 N:1** | `split` | quantity × N, avg_cost ÷ N. timeseries는 `adjusted_close` 사용 |
| **합병·교환** | `split` (재해석) | 신주 자산을 `transactions`에 새 매수로 자동 생성 |
| **매도 fees** | `sell` 행에 `fees` | cost basis에 영향 없음. 실현 손익에서 차감하여 세후 수익률 산출 |
| **매수 fees** | `buy` 행에 `fees` | cost basis에 가산 (§1.2.2 공식) |
| **환율 변동** | — | 외화 자산은 매 평가 시점에 환율 재평가, 환차손익 분리 보고 |

### 1.2.4 세후/세전 분리

`transactions.tax_treatment`별로 수익률을 분리 산출하고 출력에 `pre_tax_return`, `post_tax_return` 동시 노출 (→ 05_contract_skills.md §6.1 `SemanticMetrics.returns`).

---

## 1.3 검증 게이트

다음 검증을 **모두** 통과해야 다음 단계 진행:

- [ ] 필수 필드(`asset_id`, `timestamp`, `close`) null 아님
- [ ] `weight` 합계 1.0 ± 0.001
- [ ] `timestamp` strictly monotonic
- [ ] `base_currency` ISO-4217 유효
- [ ] (거래내역 입력 시) 모든 매도 수량 ≤ 누적 매수 수량 (음수 보유 방지)
- [ ] `analysis_config.audience` 유효 enum 또는 미지정

검증 실패 시 처리 중단 + 구체 위반 항목을 사용자에게 반환.

---

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
2. **부분 포함 매치** (예: "평균매입단가" → "평단가"): 신뢰도 0.85
3. **편집 거리** (Levenshtein ≤ 2): 신뢰도 0.6~0.8
4. **의미 임베딩** (LLM 보조): 신뢰도 0.5~0.9

신뢰도 < 0.8이면 사용자 확인 요청. 매핑 결과는 `warnings`에 기록.

### 1.4.3 다중 포트폴리오 병합 정책 (시연 2 보장)

- 동일 사용자의 추가 업로드 시 **기본은 별도 포트폴리오 비교 모드**.
- 사용자가 `merge: true` 지시 시 합산 (자산별 weight 재계산, 통화 다르면 base_currency 일괄 환산).
- 병합 결과는 `meta.portfolios: PortfolioMeta[]` 배열로 노출 (→ 05_contract_skills.md §6.1).

---

> **다음 단계**: 정규화된 데이터를 `→ 02_metrics_skills.md`로 전달하여 시맨틱 레이어 지표 계산.
