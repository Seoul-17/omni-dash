---
name: financial-dashboard-core
role: 코어 메타·파이프라인·전역 가드레일·활성화 키워드
version: 3.0.0
license: Apache-2.0
applies_to: [all-stages]
depends_on: []
loaded_when: 본 스킬 시스템 진입 시 항상 최우선 로드
---

# 00. Core Skills — 진입점·실행 규약·전역 정책

> 본 파일은 financial-dashboard 스킬 시스템의 **진입점**이다. LLM/에이전트는 어떤 단계의 작업을 하든 본 파일을 항상 먼저 로드하여 파이프라인 순서·출력 모드·audience·전역 가드레일을 결정한다.
>
> **세부 분기 규칙**: 데이터(`→ 01_data_skills.md`) · 지표(`→ 02_metrics_skills.md`) · 시각화(`→ 03_visualization_skills.md`) · 리포트(`→ 04_report_skills.md`) · 출력 계약(`→ 05_contract_skills.md`).

---

## 0.1 파이프라인 실행 순서

```
[0] 출력 모드·audience 결정 (본 파일)
       ↓
[1] 입력 어댑터 → 정규화 (→ 01_data_skills.md)
       ↓
[2] 시맨틱 레이어 지표 계산 (→ 02_metrics_skills.md)
       ↓
[3] 시각화 매트릭스 매핑 (→ 03_visualization_skills.md)
       ↓
[4] BUILD 리포트 + NLG 인사이트 (→ 04_report_skills.md)
       ↓
[5] 출력 계약 직렬화 + 캐시 (→ 05_contract_skills.md)
```

각 단계 페이로드: `{ "stage": N, "mode": "...", "audience": "...", "data": {...}, "warnings": [], "next_stage": N+1 }`

---

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

---

## 0.3 audience × mode × 트리거 충돌 해소 (NEW v3.0.0)

`audience`(novice/intermediate/expert)는 **사용자의 금융 지식 수준**의 함수이지 데이터 복잡도가 아니다. 입력 우선순위:

1. `analysis_config.audience` (→ 01_data_skills.md §1.1) 명시 → 우선 적용
2. §0.4 audience 분기 키워드 ("쉽게/처음" → novice, "방법론" → expert)
3. UI에서 명시 선택
4. 기본값 **intermediate**

> ❌ "데이터 복잡도로 audience 추정" 같은 자동 분류는 **금지**. 차원이 다름.

### 0.3.1 충돌 해소 우선순위 매트릭스

| 충돌 시나리오 | 우선 적용 | 사유 |
|---|---|---|
| **모드 vs audience**: novice + Full → 차트 6~8개 vs 화이트리스트 4종 | **audience 우선** | 사용자 친화 — 인지 부하 보호 |
| **트리거 vs audience**: novice + 베타 트리거 발동(베타는 화이트리스트 외) | **트리거 우선 + KPI 임시 노출** | 인사이트의 검증 가능성 보장 — 근거 KPI 없이 인사이트만 보이면 사용자가 검증 불가 |
| **모드 vs 트리거**: Quick + §5.2 트리거 발동 | **트리거 우선 → Standard 승격** | 위험 신호 누락 방지 (§0.2.2) |
| **audience 미지정 + risk_profile aggressive** | **expert 추정** | 위험 감수 의지가 높은 사용자는 통상 지식 수준도 높음 |

본 매트릭스 적용 결과는 `meta.conflict_resolution: { rule, applied }` 필드(→ 05_contract_skills.md §6.1)에 기록.

---

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

---

## 0.5 운영 가드레일

### 0.5.1 절대 금지

- ❌ 시맨틱 레이어(→ 02_metrics_skills.md §2)에 정의되지 않은 지표 임의 계산·표시
- ❌ 시각화 매트릭스(→ 03_visualization_skills.md §3.1) 위반 (예: 12자산 도넛)
- ❌ BUILD 5단계 일부 생략 (Quick 모드 제외)
- ❌ 환각 데이터 (입력에 없는 자산·기간·이벤트 언급)
- ❌ 단정 미래 전망 ("반드시 오를 것" 등)
- ❌ 무위험 자산 명백 열위 결과를 "양호" 포장
- ❌ 자산군별 임계(→ 02_metrics_skills.md §2.4.1) 무시한 단일 임계 적용
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
- 변경 이력은 `→ CHANGELOG.md` 단일 소스
- 버전 변경 시 캐시 전체 무효 (→ 05_contract_skills.md §6.3)

### 0.5.4 자동 검증 케이스

`docs/skills/examples/` 디렉토리에 5개 골든 케이스 (입력 CSV → 기대 출력 JSON). 명세 수정 시 골든 출력과 diff 검증.

---

> **모든 세부 규칙은 본 파일이 아닌 01~05 모듈에 있다.** 본 파일은 진입점·전역 정책만 담는다. 새 규칙 추가 시 적합한 모듈 파일에 추가하고, 모듈 간 영향이 있으면 본 파일의 §0.1 또는 §0.5에 한 줄 추가.
