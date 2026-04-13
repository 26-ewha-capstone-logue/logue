.PHONY: dev-fe dev-be dev-ai test-fe test-be test-ai build-fe build-be build-ai

# ── 개발 서버 ──────────────────────────────────
dev-fe:
	cd apps/fe && yarn dev

dev-be:
	cd apps/be && ./gradlew bootRun

dev-ai:
	cd apps/ai && uv run uvicorn main:app --reload --port 8000

# ── 테스트 ─────────────────────────────────────
test-fe:
	cd apps/fe && yarn vitest

test-be:
	cd apps/be && ./gradlew test

test-ai:
	cd apps/ai && uv run pytest

# ── 빌드 ──────────────────────────────────────
build-fe:
	cd apps/fe && yarn build

build-be:
	cd apps/be && ./gradlew bootJar -x test

build-ai:
	cd apps/ai && docker build -t logue-ai .
