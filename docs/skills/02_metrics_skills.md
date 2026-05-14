---
name: financial-dashboard-metrics
role: 시맨틱 레이어·자산군별 임계·audience 노출 정책
version: 3.0.0
license: Apache-2.0
applies_to: [stage-2]
depends_on: [00_core_skills.md, 01_data_skills.md]
loaded_when: 지표 계산 단계 (정규화 완료 후)
---

# 02. Metrics Skills — 시맨틱 레이어

> 표준 공식으로 위험·수익 지표를 계산하고, 자산군별 통계 특성에 맞게 해석하며, audience(novice/intermediate/expert)별로 노출 지표를 분기한다.
>
> **사전 조건**: `→ 01_data_skills.md` 정규화 완료.
> **다음 단계**: 시각화(`→ 03_visualization_skills.md`) + 리포트(`→ 04_report_skills.md`)에 모두 입력.

---

## 2.1 시맨틱 레이어 원칙

본 파일의 모든 지표는 **Single Source of Truth**.
- 차트·인사이트·리포트는 본 파일 외 정의로 지표 재계산 금지.
- 지표 정의 변경 시 `version` 갱신 필수 (메이저 변경 → CHANGELOG.md).
- `→ 00_core_skills.md §0.5.1` 환각 방지 가드레일과 직결.

---

## 2.2 수익률 지표

| 지표 | 수식 | 적용 조건 | 주의 |
|---|---|---|---|
| **단순 수익률** | `R_t = (P_t - P_{t-1}) / P_{t-1}` | 횡단면 가중 합산 | 시계열 누적 금지 |
| **로그 수익률** | `r_t = ln(P_t / P_{t-1})` | 시계열 누적·복리 (기본값) | 횡단면 가중 합산 금지 |
| **누적 수익률** | `Π(1+R_t) - 1` 또는 `Σr_t` | 기간 전체 성과 | 두 방식 혼용 금지 |
| **CAGR** | `(P_end/P_start)^(1/years) - 1` | 1년 이상 장기 | 산술평균 대체 시 과대추정 |

**기본값**: 시계열은 로그, 포트폴리오 일별은 단순 후 누적 시 로그 변환.

세후/세전 수익률은 `→ 01_data_skills.md §1.2.4`에 따라 분리 산출.

---

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

---

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

`risk_profile`은 `→ 01_data_skills.md §1.1 analysis_config`로 입력받음.

---

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
- 충족 여부는 `RiskMetrics.asset_class_thresholds`(→ 05_contract_skills.md §6.1)에 `info | warn | critical` 기록

---

## 2.5 계산 가드레일

- 표본 < 30 → "낮은 통계적 유의성" 플래그
- β 계산 시 R² < 0.5 → 결과 유보, 벤치마크 재검토 요청
- 분모 0 수렴 지표(트레이너 β, 샤프 σ) → N/A, 무한대 표시 금지
- 환산 시 `trading_days_per_year` 외 임의 연환산 금지

---

## 2.6 audience 노출 정책

기획서 §1 타겟 "초보 투자자"가 트레이너 비율·정보 비율을 보면 압도된다. audience별 노출 화이트리스트:

| audience | 노출 KPI | 노출 차트 | 인사이트 톤 |
|---|---|---|---|
| **novice** | 총 수익률, MDD, 변동성, 자산 비중 | line, donut, big_number_sparkline, underwater | "신호등 비유" + 용어 사전 강제 (→ 04_report_skills.md §4.5) |
| **intermediate** (기본) | + 샤프, 소르티노, 베타, CAGR, 칼마 | + treemap, multi_line, heatmap, bubble | 핵심 지표 + 간략 해석 |
| **expert** | 모든 §2.3 지표 | 모든 차트 (→ 03_visualization_skills.md §3.1) | 방법론·통계적 한계 노출 |

### 2.6.1 audience 결정 우선순위

`audience`는 **사용자 지식 수준**의 함수이지 데이터 복잡도가 아니다 (→ 00_core_skills.md §0.3). 결정 우선순위:

1. `analysis_config.audience` 명시 → 우선
2. `→ 00_core_skills.md §0.4.3` audience 분기 키워드
3. UI 명시 선택
4. 기본값 **intermediate**

> ❌ 데이터 복잡도(자산 수·기간 등)로 audience 자동 추정 **금지**.

### 2.6.2 audience × mode × 트리거 충돌

`→ 00_core_skills.md §0.3.1` 매트릭스 따름. 핵심:
- 모드 vs audience 충돌 → audience 우선 (사용자 친화)
- §5.2 트리거 vs audience 화이트리스트 충돌 → 트리거 우선 + 근거 KPI 임시 노출

---

> **다음 단계**: 계산된 지표가 `→ 03_visualization_skills.md`(차트 선택)와 `→ 04_report_skills.md`(BUILD·NLG)로 동시에 전달.
