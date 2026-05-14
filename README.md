# 📊 Omni-Dash
> **Investment Data Skills Dashboard for Smart Investors**
> 
> 복잡한 투자 데이터를 한눈에. `Skills.md` 기반의 분석 엔진으로 구현하는 지능형 금융 대시보드 서비스입니다.

---

## 🚀 Overview
**Omni-Dash**는 초보 투자자가 겪는 데이터 관리의 어려움과 분석의 한계를 해결하기 위해 탄생했습니다. 사용자가 업로드한 파편화된 금융 데이터를 표준화하고, 검증된 분석 규칙에 따라 최적화된 시각화 리포트를 제공합니다.

* **Smart Integration:** 엑셀, CSV 등 다양한 형식의 투자 기록을 원클릭 통합
* **Rule-based Engine:** `Skills.md` 명세를 통한 정확한 지표(MDD, 수익률 등) 산출
* **Auto Visualization:** 데이터 특성에 최적화된 차트 및 UI 실시간 렌더링
* **Reliable Insights:** LLM의 환각을 방지하는 팩트 중심의 투자 현황 요약

---

## 👥 Team (The Creators)

우리 팀은 효율적인 협업과 기술적 도전을 통해 최고의 결과물을 만들어냅니다.

| Name | GitHub ID | Role |
| :--- | :--- | :--- |
| **김해찬** | [@k-haechan](https://github.com/k-haechan) | Backend / AI Architecture |
| **천창현** | [@rearleg](https://github.com/rearleg) | Frontend / UI Architecture |
| **이정원** | [@JeongWon4034](https://github.com/JeongWon4034) | Data Engineering / Analysis |

---

## 🛠 Tech Stack & Principles

### **1. Core Engine: `Skills.md`**
프로젝트의 심장부입니다. 분석 규칙(What)과 기술적 구현(How)을 분리하여, 규칙 문서 수정만으로 대시보드의 논리를 즉시 업데이트할 수 있는 구조를 지향합니다.

### **2. Development Strategy**
* **Decoupling:** 데이터 처리 로직과 렌더링 레이어의 완전 분리
* **Guardrails First:** 분석 수치의 신뢰성 확보 및 단정적 진술 배제
* **Vibe Coding:** AI를 활용한 실시간 코드 생성 및 프로토타이핑 극대화

---

## 📂 Project Structure
```text
.
├── 📂 backend/            # Spring Boot 3.2 (Java 21) — Skills 파이프라인 백엔드
│   ├── src/main/java/com/omnidash/
│   │   ├── service/csv/         # Skills 01 — CSV 어댑터·정규화
│   │   ├── service/metrics/     # Skills 02 — 시맨틱 레이어 (메트릭 엔진)
│   │   ├── service/viz/         # Skills 03 — 차트 매핑
│   │   ├── service/insight/     # Skills 04 — 룰 기반 NLG
│   │   ├── service/skills/      # 임계값 외부 YAML 핫리로드
│   │   └── controller/          # /api/upload, /api/dashboard, /api/skills/reload
│   └── src/main/resources/skills/thresholds.yml  # 시연 3 핫리로드 대상
├── 📂 frontend/           # Next.js 14 (App Router, TS) — 대시보드 UI
│   └── src/
│       ├── app/                 # 업로드·대시보드 페이지
│       ├── components/charts/   # Recharts 렌더러
│       └── types/dashboard.ts   # 백엔드 DTO 1:1 미러
├── 📂 docs/               # Skills 명세 + 기획서 (변경 없음)
├── 📄 docker-compose.yml  # PostgreSQL + backend + frontend 단일 호스트
├── 📄 .env.example        # 환경변수 템플릿
└── 📄 Makefile            # up / down / logs / db-shell ...
```

---

## ⚡ Quick Start

```bash
# 1) 환경변수 템플릿 복사
cp .env.example .env       # 또는 `make env`

# 2) 전체 스택 빌드 + 기동 (PostgreSQL + Spring Boot + Next.js)
make up                    # docker compose up -d --build

# 3) 브라우저
open http://localhost:3000           # 프론트엔드
curl http://localhost:18080/api/ping # 백엔드 헬스체크 (포트 18080, 충돌 회피)
```

**검증된 동작** (2026-05-14 기준):
- `omnidash-postgres` healthy
- `omnidash-backend` healthy (Spring Boot 3.2.5, Java 21, Flyway migration OK)
- `omnidash-frontend` Next.js 14 standalone
- 업로드 → 정규화 → FX 환산 → 메트릭 → 시각화 → 인사이트 풀파이프 OK
- `POST /api/skills/reload` → cache_key 변경 → 임계 핫리로드 검증 ✓

종료: `make down` · 볼륨 포함 정리: `make clean`

### 시연 시나리오 매핑

| 시연 | 동작 |
|---|---|
| **시연 1 (편의성)** | `docs/final_skills/examples/05_messy_input.csv` 업로드 → 자동 컬럼 매핑 + 3초 내 대시보드 |
| **시연 2 (일관성)** | 같은 세션에 `02_global_etf.csv`, `03_multi_asset.csv` 추가 업로드 → 동일 레이아웃의 비교 가능 |
| **시연 3 (확장성)** | `backend/src/main/resources/skills/thresholds.yml` 수정 후 대시보드의 **🔁 Skills 재로드** 클릭 → 인사이트·임계 색상 즉시 갱신 |

### 환경변수

전부 `.env`에서 일괄 관리 (`.env.example` 참고):

| 변수 | 기본값 | 설명 |
|---|---|---|
| `POSTGRES_*` | omnidash | PostgreSQL 자격증명 |
| `BACKEND_PORT` | 18080 | Spring Boot 포트 (8080 충돌 회피용) |
| `FRONTEND_PORT` | 3000 | Next.js 포트 |
| `SESSION_TTL_SECONDS` | 86400 | 익명 세션 쿠키 만료 (24h) |
| `CORS_ALLOWED_ORIGINS` | http://localhost:3000 | 프론트 도메인 |
| `SKILLS_CONFIG_PATH` | (empty) | 외부 thresholds.yml 디렉토리. 비우면 jar 내부 |
| `NEXT_PUBLIC_API_BASE_URL` | http://localhost:18080 | 브라우저용 백엔드 URL (빌드 타임) |
| `INTERNAL_API_BASE_URL` | http://backend:8080 | SSR용 백엔드 URL (컴포즈 네트워크 내부) |

### 배포

`docker-compose.yml`은 어디든 그대로 옮겨 동작합니다.
프로덕션은 `.env`에서 `POSTGRES_PASSWORD` 변경 + `CORS_ALLOWED_ORIGINS`를 실제 도메인으로만 변경하면 끝.
TLS는 Caddy / Nginx 등 리버스 프록시로 처리 권장.

---

## 🔗 Links
* **Official Page:** [Hackathon: Investment Data Skills Dashboard](https://daker.ai/public/hackathons/hackathon-investment-data-skills-dashboard)
* **Docs:** [Challenge Details & Rules](https://daker.ai/public/hackathons/hackathon-investment-data-skills-dashboard?section=description)
* **Status:** [Leaderboard](https://daker.ai/public/hackathons/hackathon-investment-data-skills-dashboard?section=leaderboard)

---

## ⚖️ Disclaimer
본 서비스는 투자 참고용 데이터를 제공하며, 투자 자문을 수행하지 않습니다. 모든 투자의 책임은 사용자 본인에게 있습니다.

---
**© 2026 Omni-Dash Team. All rights reserved.**
