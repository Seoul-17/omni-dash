# Skills 명세 인덱스 — financial-dashboard v3.0.0

> 본 디렉토리는 Omni-Dash 금융 투자 대시보드 자동 생성 스킬 시스템의 명세이다.
> 6개 역할별 모듈 + CHANGELOG로 구성되며, `docs/notice/개요.md` "1개 또는 여러 개 제출 가능 / 기능별·역할별 구분 / .zip 제출" 규정을 따른다.

---

## 모듈 구성

| # | 파일 | 역할 (한 줄) | 라인 |
|---|---|---|---|
| 0 | [`00_core_skills.md`](./00_core_skills.md) | 진입점·파이프라인·출력 모드·audience 결정·전역 가드레일·트리거 키워드 | ~140 |
| 1 | [`01_data_skills.md`](./01_data_skills.md) | 데이터 정규화·거래내역 변환·입력 어댑터·다중 포트폴리오 병합 | ~150 |
| 2 | [`02_metrics_skills.md`](./02_metrics_skills.md) | 시맨틱 레이어 (수익률·위험 지표)·자산군별 차등 임계·audience 노출 정책 | ~180 |
| 3 | [`03_visualization_skills.md`](./03_visualization_skills.md) | 차트 선택 매트릭스·색상 거버넌스·Z-Layout·라이브러리 매핑 | ~140 |
| 4 | [`04_report_skills.md`](./04_report_skills.md) | BUILD 5단 프레임워크·NLG 인사이트·임계 트리거·초보자 용어 사전 | ~170 |
| 5 | [`05_contract_skills.md`](./05_contract_skills.md) | TypeScript 출력 계약·모드별 채움·캐시·핫리로드·E2E 예시 | ~220 |
| — | [`CHANGELOG.md`](./CHANGELOG.md) | 버전 변경 이력 (SemVer) | ~110 |
| — | `examples/` (예정) | 골든 케이스 5종 (입력 CSV → 기대 출력 JSON) | — |

**합계**: ~1,000라인 (단일 skills_v2.md 789라인 대비 cross-ref 오버헤드 +27%)

---

## 의존 관계

```
                  00_core_skills.md   ← 항상 로드
                          │
                          ↓
            01_data_skills.md  (정규화·어댑터)
                          │
                          ↓
            02_metrics_skills.md  (지표·임계·audience)
                          │
                ┌─────────┴─────────┐
                ↓                   ↓
   03_visualization_skills.md   04_report_skills.md
        (차트 매핑)              (BUILD·NLG)
                └─────────┬─────────┘
                          ↓
            05_contract_skills.md  (직렬화·캐시)
                          │
                          ↓
                    프론트엔드 렌더링
```

- **00**: 메타·전역 정책. 어떤 단계든 항상 로드.
- **01 → 02**: 정규화된 데이터가 시맨틱 레이어 입력.
- **02 → 03·04**: 지표는 차트 선택과 인사이트 생성에 모두 필요.
- **03·04 → 05**: 시각화 결과 + 인사이트가 출력 계약으로 직렬화.

---

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
| Recharts vs Plotly 언제 어느 것? | `03 §3.4.1` |
| BUILD 5단 헤더 구조는? | `04 §4.1` |
| MDD 임계 초과 시 자동 인사이트? | `04 §4.4` |
| novice용 "MDD" 풀이는? | `04 §4.7` |
| 출력 JSON의 `RiskMetrics` 타입은? | `05 §6.1` |
| 캐시 키는 무엇으로 만드는가? | `05 §6.3.1` |
| Skills.md 수정 시 캐시 어떻게 무효화? | `05 §6.3.2` |

---

## 핵심 설계 원칙

| 원칙 | 의미 | 구현 위치 |
|---|---|---|
| **Decoupling** | 규칙(What) ↔ 구현(How) 분리 | 본 명세는 무엇만 정의, 코드는 LLM이 컴파일 |
| **Single Source of Truth** | 지표는 한 곳에서만 정의 | `02_metrics_skills.md` 시맨틱 레이어 |
| **Progressive Disclosure** | 자주 쓰는 규칙만 본문, 세부는 분리 | 본 6모듈 분할 자체 |
| **Guardrails First** | 안전한 기본값과 금지 행위 우선 | `00 §0.5`, 모듈별 가드레일 |

---

## 버전 정보

- **현재 버전**: 3.0.0 (2026-05-07)
- **이전 버전**: 2.0.0 (단일 `skills_v2.md`, 2026-05-07 작성)
- **SemVer 정책**: 지표·타입 변경=메이저 / 임계·구조 추가=마이너 / 문구 수정=패치
- 변경 이력: [`CHANGELOG.md`](./CHANGELOG.md)

---

## 제출 형식 (개요.md 준수)

`docs/notice/개요.md §2 Skills.md 문서`에 따라 본 디렉토리(`docs/skills/`)를 zip으로 묶어 제출:

```bash
zip -r skills.zip docs/skills/ -x "*.zip" "examples/*"
```

각 `.md` 파일을 PDF로 변환한 후 zip하는 형식도 허용.

---

## 핵심 가치 (기획서 §1)

| 가치 | 본 명세에서의 실현 |
|---|---|
| **재사용성** | 모듈별 분할로 다른 도메인(부동산·예술품 투자 등)에 부분 재사용 가능 |
| **검증 가능성** | `[ref: metric=, period=, n=]` 추적성 + `examples/` 골든 케이스 |
| **협업성** (비개발자 수정) | 마크다운 텍스트 수정만으로 임계·룰 변경 (시연 3) |
| **모듈성** | 6개 파일 단일 책임, 한 영역 변경이 다른 영역에 미치는 영향 의존성 그래프(`05 §6.3.3`)로 명시 |

---

> **본 명세는 살아있는 문서다.** 새 지표·시각화·인사이트 패턴이 도출되면 적합한 모듈에 추가하고 버전을 올린다. 코드를 수정하지 말고 명세를 수정하라 — 코드는 명세로부터 다시 컴파일된다.
