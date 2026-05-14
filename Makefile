SHELL := /bin/bash
.DEFAULT_GOAL := help

ENV_FILE ?= .env

.PHONY: help env up down rebuild logs ps clean backend-shell frontend-shell db-shell test

help: ## 사용 가능한 명령어
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

env: ## .env가 없으면 .env.example을 복사
	@if [ ! -f $(ENV_FILE) ]; then cp .env.example $(ENV_FILE); echo "Created $(ENV_FILE)"; else echo "$(ENV_FILE) already exists"; fi

up: env ## 전체 스택 빌드 + 기동
	docker compose --env-file $(ENV_FILE) up -d --build

down: ## 컨테이너 중지·삭제
	docker compose --env-file $(ENV_FILE) down

rebuild: ## 캐시 없이 재빌드
	docker compose --env-file $(ENV_FILE) build --no-cache

logs: ## 모든 서비스 로그 follow
	docker compose --env-file $(ENV_FILE) logs -f --tail=200

ps: ## 컨테이너 상태
	docker compose --env-file $(ENV_FILE) ps

clean: ## 컨테이너 + 볼륨까지 삭제 (DB 데이터 손실)
	docker compose --env-file $(ENV_FILE) down -v

backend-shell: ## 백엔드 컨테이너 진입
	docker compose --env-file $(ENV_FILE) exec backend sh

frontend-shell: ## 프론트엔드 컨테이너 진입
	docker compose --env-file $(ENV_FILE) exec frontend sh

db-shell: ## psql 진입
	docker compose --env-file $(ENV_FILE) exec postgres psql -U $${POSTGRES_USER:-omnidash} -d $${POSTGRES_DB:-omnidash}

test: ## 백엔드 단위 테스트
	cd backend && ./gradlew test
