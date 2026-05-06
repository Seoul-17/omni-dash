---
name: financial-dashboard-report
role: BUILD 프레임워크·NLG 인사이트·임계 트리거·초보자 용어 사전
version: 3.0.0
license: Apache-2.0
applies_to: [stage-4, stage-5]
depends_on: [00_core_skills.md, 02_metrics_skills.md, 03_visualization_skills.md]
loaded_when: 리포트 구성·인사이트 생성 단계
---

# 04. Report Skills — BUILD 프레임워크 + NLG 인사이트

> 지표·차트를 BUILD 5단 구조로 조립하고, 임계 트리거에 따라 인사이트를 자동 생성한다. audience별 톤을 적용한다.
>
> **사전 조건**: `→ 02_metrics_skills.md` 지표 + `→ 03_visualization_skills.md` 차트 ID 준비됨.
> **다음 단계**: `→ 05_contract_skills.md` 출력 계약으로 직렬화.

---

## 4.1 BUILD 프레임워크 강제 헤더 구조

모든 분석 리포트 출력은 **반드시 5단계 마크다운 헤더 구조**를 따른다. 단계 생략·순서 변경 금지. (단, Quick 모드는 BUILD 전체 생략 — `→ 00_core_skills.md §0.2`.)

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

각 placeholder의 타입은 `→ 05_contract_skills.md §6.1` 참조.

---

## 4.3 인사이트 생성 원칙 (NLG)

- **숫자 나열 금지** — "수익률 5%"가 아니라 "벤치마크 대비 2%p 초과 성과로 종목 선택이 시장 타이밍보다 효과적"
- **인과 3단** — 원인(What drove) → 결과(So what) → 함의(Now what)
- **추적성 강제** — 모든 인사이트 끝에 `[ref: metric=, period=, n=]` 부착
- **환각 방지** — `→ 02_metrics_skills.md` 외 지표 생성·언급 금지
- **편향 회피** — 단정 미래 전망 금지, "조건 X 유지 시 Y 시나리오 확률↑" 형태 조건부 진술

---

## 4.4 임계값 기반 자동 경고 트리거

다음 조건 충족 시 **자동으로 해당 코멘트를 리포트에 삽입**한다. 임계는 `→ 02_metrics_skills.md §2.4.1` 자산군별 차등 우선 적용.

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

audience 화이트리스트(→ 02_metrics_skills.md §2.6)에 없는 KPI에 트리거가 발동되는 경우:
- **트리거 우선**: 인사이트 삽입 + 근거 KPI를 임시 노출 (검증 가능성 보장)
- 적용 결과는 `meta.conflict_resolution`(→ 05_contract_skills.md §6.1)에 기록
- 상세 우선순위: `→ 00_core_skills.md §0.3.1`

---

## 4.5 인사이트 출력 포맷

```markdown
**[심각도 아이콘] [제목]**
- **무엇이 발견되었나**: {observation} `[ref: metric=, period=, n=]`
- **왜 중요한가**: {implication}
- **권장 행동**: {recommended_action}
- **모니터링 지표**: {follow_up_metrics}
```

심각도 아이콘 enum: `⚠️ | ⚡ | 🔻 | 🎯 | 🔗 | 📈 | 💥 | ⏳ | 📉 | 💼 | 📊` — `→ 05_contract_skills.md §6.1 InsightIcon` literal 타입.

---

## 4.6 톤 & 매너 (audience 분기)

- **객관적·전문적** — 감탄사·과장 형용사 금지 ("놀라운", "엄청난")
- **간결성** — 1 인사이트 4문장 이내
- **audience 적응** (→ 02_metrics_skills.md §2.6 연동):
  - **novice** → §4.7 용어 사전 강제 적용, 신호등 비유, 친근한 톤
  - **intermediate** (기본) → 핵심 지표 + 간략 해석, 중립적 톤
  - **expert** → 방법론·통계적 한계 노출, 전문 용어 그대로

언어는 `analysis_config.locale`(→ 01_data_skills.md §1.1) 따름. `auto`이면 입력 데이터·KPI 라벨 언어로 추정.

---

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

---

> **다음 단계**: 조립된 BUILD 리포트 + 인사이트 배열은 `→ 05_contract_skills.md` 출력 계약으로 직렬화.
