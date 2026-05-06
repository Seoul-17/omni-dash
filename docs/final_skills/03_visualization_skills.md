---
name: financial-dashboard-visualization
role: 차트 선택 매트릭스·색상·레이아웃·라이브러리 매핑
version: 3.0.0
license: Apache-2.0
applies_to: [stage-3]
depends_on: [00_core_skills.md, 02_metrics_skills.md]
loaded_when: 시각화 매핑 단계 (지표 계산 완료 후)
---

# 03. Visualization Skills — 차트 선택·렌더링 규칙

> 분석 목적과 데이터 형태에 따라 **기계적으로** 차트를 선택한다. 미학적 선호로 매트릭스 위반 금지.
>
> **사전 조건**: `→ 02_metrics_skills.md` 지표 계산 완료, audience 결정.
> **다음 단계**: `→ 04_report_skills.md` 리포트 앵커 차트 + `→ 05_contract_skills.md` ChartSpec 직렬화.

---

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

---

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

---

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

`→ 02_metrics_skills.md §2.6` 화이트리스트 따라 차트 노출:
- novice → [1][3][4] 위주, 5·6 생략 가능
- intermediate (기본) → [1]~[5]
- expert → [1]~[6] 전체 + 부속 분석 차트

audience-mode 충돌 시 `→ 00_core_skills.md §0.3.1` 우선순위 적용.

---

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

---

## 3.5 차트 메타데이터 필수 항목

모든 차트는 `→ 05_contract_skills.md §6.1 ChartSpec`을 따르며 다음 필수:

- `source`: "Yahoo Finance / 2026-04-30 종가" 형식 데이터 출처·기준일
- `caveat`: 통계 유의성 부족 시 "표본 < 30, 통계 보통" 등
- `encoding.color_map`: §3.2 시맨틱 컬러 키 사용
- `annotations`: 위기 시점·임계 초과 시점은 어노테이션으로 표시

---

> **다음 단계**: 선택된 차트 ID는 `→ 04_report_skills.md` BUILD-I의 anchor_chart에 참조되고, ChartSpec은 `→ 05_contract_skills.md`로 직렬화.
