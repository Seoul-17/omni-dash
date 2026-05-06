# Omni-Dash Skills — 금융 투자 대시보드 자동 생성 명세

> **여기가 시작점입니다.** 본 README는 30초 읽기로 전체 구조를 파악할 수 있도록 설계되었습니다.

---

## 무엇인가

투자 데이터(CSV·JSON·거래내역)를 입력하면 검증된 분석 규칙으로 위험·수익 지표를 계산하고, 데이터 특성에 맞는 차트를 자동 선택하며, BUILD 5단 프레임워크로 인사이트를 자동 생성하는 **금융 대시보드 명세 시스템**.

**핵심 차별화 4가지**:

1. **Quick / Standard / Full 3단 출력 모드** — "MDD만" 같은 단순 질의에 풀 파이프라인을 강제하지 않음
2. **자산군별 차등 임계값** — 채권 0.5와 암호자산 1.0의 의미가 완전히 다름. 단일 임계 대신 상대 프레임워크
3. **audience 노출 정책** (novice/intermediate/expert) — 초보 투자자가 트레이너 비율을 보고 압도되지 않도록 화이트리스트
4. **`[ref: metric=, period=, n=]` 추적성 강제** — LLM 환각 차단 + 검증 가능성 확보

---

## 어디부터 읽어야 하나

| 목적 | 추천 순서 |
|---|---|
| **전체 구조 파악** | [`INDEX.md`](./INDEX.md) — 모듈 지도와 의존 그래프 |
| **명세를 따라 구현하려면** | `00 → 01 → 02 → 03 → 04 → 05` 순서 |
| **특정 규칙 찾기** | [`INDEX.md` §빠른 참조](./INDEX.md) — "어디 가서 무엇을 찾는가" |
| **예시로 동작 확인** | [`examples/`](./examples/) — 입력 CSV + 기대 출력 JSON |
| **버전 이력** | [`CHANGELOG.md`](./CHANGELOG.md) — v1.0.0 → v3.0.0 진화 |

---

## 명세 시스템 한 그림

```
사용자 입력 (CSV / JSON / 거래내역)
         ↓
┌────────────────────────────────┐
│ 00_core_skills.md              │  ← 항상 로드
│  • 출력 모드 (Quick/Std/Full)   │
│  • audience 결정                │
│  • 전역 가드레일                │
└────────────────────────────────┘
         ↓
┌────────────────────────────────┐
│ 01_data_skills.md              │
│  • 입력 어댑터 (자동 컬럼 매핑) │
│  • 거래내역 → 잔고 변환         │
│  • 표준 스키마 정규화            │
└────────────────────────────────┘
         ↓
┌────────────────────────────────┐
│ 02_metrics_skills.md           │
│  • 시맨틱 레이어 (지표 14종)    │
│  • 자산군별 차등 임계값          │
│  • audience 노출 정책            │
└────────────────────────────────┘
         ↓
   ┌──────┴──────┐
   ↓             ↓
┌──────────┐  ┌──────────────┐
│ 03_viz   │  │ 04_report    │
│  매트릭스 │  │  BUILD 5단    │
│  18종 차트│  │  NLG 인사이트 │
└──────────┘  └──────────────┘
   └──────┬──────┘
         ↓
┌────────────────────────────────┐
│ 05_contract_skills.md          │
│  • JSON 출력 계약               │
│  • 캐시·핫리로드                │
│  • E2E 검증 사례                │
└────────────────────────────────┘
         ↓
   프론트엔드 (React/Vue) 렌더링
```

---

## 디렉토리 구조

```
docs/final_skills/
├── README.md                       ← 본 파일 (진입점)
├── INDEX.md                        ← 모듈 지도 + 빠른 참조
├── 00_core_skills.md               ← 진입점·파이프라인·전역 정책
├── 01_data_skills.md               ← 정규화·어댑터·병합
├── 02_metrics_skills.md            ← 시맨틱·임계·audience
├── 03_visualization_skills.md      ← 차트·색상·라이브러리
├── 04_report_skills.md             ← BUILD·NLG·용어 사전
├── 05_contract_skills.md           ← 출력 계약·캐시·E2E
├── CHANGELOG.md                    ← v1.0.0 → v3.0.0 이력
└── examples/
    ├── 01_kr_equity_simple.csv     국내 주식 단일 자산군
    ├── 02_global_etf.csv           해외 ETF 분산
    ├── 03_multi_asset.csv          다자산군 혼재 (시연 2)
    ├── 04_transactions.csv         거래내역 → 잔고 변환
    ├── 05_messy_input.csv          양식 엉망 (시연 1)
    ├── 01_kr_equity_simple.output.json   골든 출력 1
    └── 03_multi_asset.output.json        골든 출력 2 (Full report)
```

---

## 5분 내 핵심 검증

심사위원이 명세의 작동을 빠르게 확인하려면:

1. **입력**: [`examples/03_multi_asset.csv`](./examples/03_multi_asset.csv) — 한국 주식 + 미국 ETF + 비트코인 + 채권 혼재
2. **기대 출력**: [`examples/03_multi_asset.output.json`](./examples/03_multi_asset.output.json)
3. **확인 포인트**:
   - `meta.mode = "standard"`, `meta.audience = "intermediate"` (자동 결정)
   - BTC 비중 22%가 equity 임계 30%는 미달이지만 **crypto 임계 15%를 초과** → `RiskMetrics.asset_class_thresholds.crypto = "critical"` (자산군별 차등의 효과)
   - 인사이트에 `[ref: metric=concentration, period=2026-04-30, n=1]` 추적성 부착
   - BUILD-D 액션이 "BTC 10%로 트림 + TLT 편입"으로 구체적 (자산명·비중·시점)

---

## 핵심 가치 (기획서 §1)

| 가치 | 본 명세에서의 실현 |
|---|---|
| **재사용성** | 모듈별 분할로 다른 도메인(부동산·예술품 투자 등) 부분 재사용 가능 |
| **검증 가능성** | `[ref:]` 추적성 + `examples/` 골든 케이스 |
| **협업성** (비개발자 수정) | 마크다운 텍스트 수정만으로 임계·룰 변경 (시연 3) |
| **모듈성** | 6개 파일 단일 책임, 의존성 그래프 명시 (`05 §6.3.3`) |

---

## 제출 정보

- **버전**: v3.0.0 (2026-05-07)
- **명세 분량**: 8개 핵심 문서 + 7개 예시 파일
- **라이선스**: Apache-2.0
- **언어**: 한국어 (인사이트는 `analysis_config.locale`에 따라 ko-KR / en-US)

**압축 명령**:
```bash
cd docs/final_skills && zip -r ../../skills.zip . -x "*.DS_Store"
```

---

> **본 명세는 살아있는 문서다.** 새 지표·시각화·인사이트 패턴이 도출되면 적합한 모듈에 추가하고 버전을 올린다. **코드를 수정하지 말고 명세를 수정하라** — 코드는 명세로부터 다시 컴파일된다.
