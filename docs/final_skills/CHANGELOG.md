# Skills 명세 변경 이력 (CHANGELOG)

본 문서는 `docs/skills/` 명세의 변경 이력을 SemVer 규칙에 따라 기록한다.

- **MAJOR**: 지표 정의 변경, 출력 계약 호환성 깨짐, 명세 구조 변경
- **MINOR**: 임계값 조정, 구조 추가 (호환 유지)
- **PATCH**: 문구·예시 수정

---

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

기획서 §2.1 Progressive Disclosure 원칙 회수, 개요.md "기능별·역할별 구분" 권고 부합.

### Added
- `00 §0.3.1` audience × mode × 트리거 충돌 해소 매트릭스 (v4 §9.4 #2)
- `01 §1.2.3` 자산 이벤트 처리 정책 (dividend/split/매도 fees/환율) (v4 §9.4 #4)
- `01 §1.1 analysis_config.cost_basis_method` (FIFO/LIFO/이동평균 선택)
- `01 §1.1 analysis_config.locale` (ko-KR/en-US/auto, i18n 정책)
- `01 §1.4.2` 매핑 알고리즘 (정확/부분/Levenshtein/임베딩 4단계 신뢰도)
- `04 §4.7` 초보자 용어 사전 3개 추가 (트레이너·정보 비율·알파)
- `05 §6.1` named type 추출 (`AssetClass`, `Mode`, `Audience`, `RiskProfile`, `ChartType`, `InsightIcon`, `ValueDirection`)
- `05 §6.1` `meta.conflict_resolution` 필드 (충돌 해소 적용 기록)
- `05 §6.3.2` 캐시 stampede 방지 정책

### Changed (BREAKING)
- `version` 2.0.0 → 3.0.0 (구조 변경 + 출력 계약 타입 정밀화)
- **`asset_class_thresholds`**: `Record<string, Severity>` → `Partial<Record<AssetClass, Severity>>` (v4 §9.4 #3)
- **`KPI.semantic_color`**: 7색 union → `ValueDirection` 3색 + `severity` 별도 필드 (의미 차원 분리)
- **`Insight.icon`**: `string` → `InsightIcon` literal union 11종 (LLM 환각 방지)
- `meta.locale` 필드 추가 (필수)
- audience 자동 결정에서 "데이터 복잡도 추정" 로직 **제거** (v4 §9.4 #1) — 차원 오류 수정. `analysis_config.audience` 명시 또는 키워드 기반만 인정

### Migration (2.0.0 → 3.0.0)
- 출력 계약 소비자: `KPI.semantic_color`를 `ValueDirection`으로 좁히고, 임계 도달 정보는 `KPI.severity` 별도 필드로 처리
- `Insight.icon`은 11종 literal union 외 값 사용 금지
- audience를 입력 데이터로 자동 추정하던 코드 삭제, 명시 입력으로 전환
- 단일 `skills_v2.md` 참조하던 코드는 `INDEX.md` 또는 적합한 모듈 파일 참조로 교체

### Notes
- `skills_v0.md` `skills_v1.md` `skills_v2.md`는 이력 보존을 위해 유지하되, **공식 명세는 6모듈 + INDEX**.
- `examples/` 디렉토리는 별도 작업 (v4 §9.4 #5).

---

## [2.0.0] — 2026-05-07 (`skills_v2.md`)

### Added
- §1.1 `transactions` 스키마 (거래내역 시계열) + `analysis_config` 블록 (`risk_profile`·`audience`·`benchmark_id`·`analysis_period` 일괄 관리)
- §1.1 `sector` 필드에 KRX 33개 분류 지원 추가
- §1.2 거래내역 → 잔고 변환 규칙 (이동평균법) + 세후/세전 분리 보고
- §1.4 입력 어댑터 (자동 컬럼 매핑 사전, 다중 포트폴리오 병합 정책) — 기획서 §5 시연 1·2 보장
- §2.3 위험 지표 4종 추가: VaR 95%, CVaR 95% (Expected Shortfall), 칼마 비율(Calmar), 회복 기간(Recovery Period)
- §2.4 기본 파라미터에 `var_confidence`, `recovery_warning_days` 추가
- §2.4.1 자산군별 임계에 칼마·CVaR 95% 행 추가
- §2.6 audience 노출 정책 (novice / intermediate / expert별 KPI·차트·톤 화이트리스트)
- §3.1 차트 매트릭스 5종 추가: rolling_window, efficient_frontier, drawdown_dist, factor_attribution, correlation_evolution
- §3.4 신규 차트의 라이브러리 매핑
- §5.2 자동 트리거 3종 추가: 회복 기간 > 252영업일, CVaR 자산군 임계 초과, 칼마 자산군 미달
- §5.5 초보자 용어 사전 (10개 지표) — novice audience 강제 적용
- §6.1 `PortfolioMeta` 인터페이스, `KPI.unit`에 `"days"` 추가, `Insight.icon` enum 확장
- §6.3 캐시·핫리로드 정책 + 의존성 그래프 — 기획서 §5 시연 3 보장
- §7.4 자동 검증 케이스 (golden file) 정책
- §8 트리거 키워드에 VaR·CVaR·칼마·회복 + audience 분기 키워드
- §9.1 Quick 모드 출력 JSON 풀 사례

### Changed
- `version` 1.1.0 → 2.0.0 (출력 계약 호환성 변경: `tracking_error`·`sortino` 위치 이동)
- 출력 계약 enum 통일: `Severity = "info" | "warn" | "critical"` 단일 타입으로 `Insight.severity`와 `RiskMetrics.asset_class_thresholds` 모두 사용 (이전 `"ok"` → `"info"`로 변경)
- `BenchmarkComparison.tracking_error` 단일 정의 (이전 `SemanticMetrics.benchmark.tracking_error` 중복 제거)
- `RiskMetrics.sortino` 단일 정의 (이전 `SemanticMetrics.risk_adjusted.sortino` 중복 제거)
- `meta.skill_version` `"1.1.0"` → `"2.0.0"`
- §0.5 응답 시간 목표를 p50/p95 분리 + 캐시 적중/콜드 분리 (기획서 시연 1의 3초 약속과 정합성 확보)
- §0.5에 기획서 §4 "3-Step 리포트 모드" ↔ Quick/Standard/Full 1:1 대응 명시
- §2.3 표 임계값 해석을 §2.4.1로 일괄 위임
- §5.4 톤 매너를 §2.6 audience 분기와 연동
- §7.1 가드레일에 "audience 무관 출력 금지" 추가
- 본 문서 식별자: `skills_v1.md` → `skills_v2.md`
- CHANGELOG를 본문 §10에서 본 별도 파일로 분리

### Removed
- 본문 §10 인라인 CHANGELOG 섹션 (본 파일로 이전)

### Migration Notes (1.1.0 → 2.0.0)
- 출력 계약 소비자(프론트엔드)는 `tracking_error`를 `BenchmarkComparison`에서만, `sortino`를 `RiskMetrics`에서만 읽도록 수정 필요.
- `RiskMetrics.asset_class_thresholds` 값에서 `"ok"`를 `"info"`로 매핑.
- 신규 필수 필드 없음. 신규 추가 필드(`recovery_days`, `cvar_95`, `calmar`, `audience`, `cache_key`, `portfolios`)는 모두 선택적 또는 기본값 보유.

---

## [1.1.0] — 2026-05-07 (`skills_v1.md`)

### Added
- §0.5 Quick / Standard / Full 3단 출력 모드 (자동 결정·승격 로직 포함)
- §2.4.1 자산군별 차등 임계값 표 (equity / etf / bond / crypto / commodity × 변동성/MDD/베타/샤프/집중도)
- §3.4 차트 타입 → 추천 라이브러리 매핑 (Recharts / Plotly / D3)
- §6.1 ChartSpec / Insight / KPI / RiskMetrics 등 하위 타입 풀 정의
- §6.2 모드별 출력 필드 채움 규칙
- §9.1 샘플 입력 → 출력 E2E 예시
- §10 CHANGELOG 섹션 (인라인)

### Changed
- §2.3 위험 조정 지표 표의 임계값 해석을 §2.4.1로 위임
- §5.1 인사이트 `ref` 추적 형식에 `n=` (표본 수) 필수화
- §5.2 임계값 트리거를 자산군별 차등으로 재정의
- §7.1 가드레일에 "자산군별 임계 무시 금지" 추가
- 본 문서 식별자: `Skills.md` → `skills_v1.md`

---

## [1.0.0] — 2026-05-05 (`skills_v0.md`)

### Initial
- 9개 섹션 기본 명세 (파이프라인 → 정규화 → 시맨틱 → 시각화 → BUILD → NLG → 출력 → 가드레일 → 트리거)
- TypeScript 출력 인터페이스 최상위 정의
- 401라인, version 1.0.0
