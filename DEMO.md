# 🎬 Omni-Dash 시연 가이드

기획서 §5 시연 시나리오 1·2·3을 그대로 재현할 수 있는 단계별 가이드입니다.

## 사전 준비

```bash
cp .env.example .env
make up                       # 백엔드/프론트엔드/PG 빌드 + 기동 (최초 5~8분)
```

기동 확인:
```bash
curl -s http://localhost:18080/api/ping
# {"status":"ok","service":"omnidash-backend","skillVersion":"3.0.0"}
```

브라우저: <http://localhost:3000>

---

## 시연 1 — 양식 엉망인 입력도 즉시 대시보드

파일: `docs/final_skills/examples/05_messy_input.csv` (티커/종목/분류... 어순 뒤바뀐 한국어 헤더)

1. 메인 페이지에서 파일을 드래그 앤 드롭.
2. **"기준 통화 KRW · 위험 moderate · audience intermediate · mode standard"** 로 업로드.
3. 자동으로 `/dashboard/{portfolioId}` 로 이동.
4. **경고 패널**에 자동 매핑 신뢰도가 낮은 컬럼이 표시됨 (Skills 01 §1.4.2).
5. KPI 5종 + 차트 4종 + 인사이트 카드 노출.

**Wow Point**: "Apple Inc의 평단가 누락" 등 결측치도 자동 보정해 분석이 끊기지 않음.

---

## 시연 2 — 다른 스키마로 추가 업로드 (일관성)

1. 시연 1을 마친 상태에서 메인 페이지로 돌아옴 (`/`).
2. `02_global_etf.csv` (영문 헤더) 업로드 → 대시보드 자동 이동.
3. 메인 페이지로 돌아오면 **"최근 업로드"** 섹션에 두 포트폴리오가 카드로 나란히 노출.
4. `03_multi_asset.csv` (KR equity + ETF + crypto + bond 혼합) 업로드.

**Wow Point**: 입력 컬럼명·자산군·통화가 전부 달라도 동일한 KPI 레이아웃·차트 종류로 렌더됨. Skills 05 출력 계약이 단일 진실의 원천이기 때문.

---

## 시연 3 — 코드 수정 없이 Skills.md 텍스트만 바꿔 임계 갱신

> 이 시연이 본 프로젝트의 **가장 차별화된 부분**입니다.

준비 — 외부 임계값 파일을 호스트에 둡니다:

```bash
mkdir -p ./skills-override
cp backend/src/main/resources/skills/thresholds.yml ./skills-override/

# .env 수정
echo "SKILLS_CONFIG_PATH=/skills" >> .env
```

`docker-compose.yml`에 볼륨 마운트가 필요합니다 (한 줄 추가):

```yaml
services:
  backend:
    volumes:
      - ./skills-override:/skills:ro
```

(또는 `docker compose down && make up` 으로 재기동)

1. 대시보드에서 `kpi_calmar` (칼마 비율) 카드의 severity 색상을 확인.
2. 호스트에서 `./skills-override/thresholds.yml` 편집:
   ```yaml
   asset_classes:
     equity:
       calmar_good: 0.9   # 0.5 → 0.9 (엄격화)
       concentration_warn: 0.20  # 0.30 → 0.20 (엄격화)
   ```
3. 대시보드 우상단 **🔁 Skills 재로드** 버튼 클릭.
4. 페이지가 새로고침되며:
   - 더 많은 자산이 "비중 임계 초과" 인사이트로 떠오름.
   - `kpi_calmar` 카드가 `warn` 배지를 단다.
   - 캐시 키가 변경됨 (footer `cache_key` 값 확인).

**Wow Point**: 백엔드 재빌드·재기동 없이 운영자가 텍스트 한 줄만 바꾸면 분석 규칙 전체가 즉시 갱신됨. Skills 05 §6.3 "skill_version 변경 → 모든 캐시 무효" 보장 충족.

---

## 예제 CSV별 기대 결과 요약

| 파일 | 입력 유형 | 인사이트 예상 |
|---|---|---|
| `01_kr_equity_simple.csv` | 한국어 잔고 | "단일 자산군 노출 — 분산 효과 제한" (info) |
| `02_global_etf.csv` | 영문 ETF | "샤프 비율 ETF 임계 미달" 또는 양호 |
| `03_multi_asset.csv` | 다자산 혼합 | "BTC 단일 자산 비중 임계 초과" (warn) |
| `04_transactions.csv` | 거래내역 | 자동으로 잔고 변환 + "거래내역 기반 산출" 경고 |
| `05_messy_input.csv` | 양식 엉망 | 매핑 신뢰도 낮음 경고 + 정상 분석 진행 |

---

## 트러블슈팅

| 증상 | 해결 |
|---|---|
| `localhost:3000` 접속 안됨 | `make ps`로 frontend 상태 확인 |
| 백엔드 헬스체크 실패 | `make logs`로 backend 로그 확인. Flyway 실패 시 `make clean && make up` |
| 업로드 시 CORS 에러 | `.env`의 `CORS_ALLOWED_ORIGINS`에 실제 프론트 URL 추가 |
| Skills 재로드해도 변화 없음 | `SKILLS_CONFIG_PATH` 환경변수가 잘 마운트됐는지 확인. `docker compose exec backend ls /skills` |
| 캐시가 비워지지 않음 | DB 직접 정리: `make db-shell` → `DELETE FROM dashboard_cache;` |
