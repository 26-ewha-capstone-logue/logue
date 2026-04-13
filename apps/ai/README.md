# logue-ai

Python 3.11 + FastAPI + uv 기반 프로젝트 스캐폴드입니다.

## Included

- FastAPI
- Uvicorn
- Pydantic v2
- Optional ML extras (pandas, sentence-transformers)
- pytest
- GitHub Actions CI
- Python logging

## Health check wiring

- Local endpoint: /health
- Upstream endpoint (default): https://ai.logue-kr.site/health
- Override with env var: UPSTREAM_HEALTH_URL
- Timeout seconds env var: UPSTREAM_TIMEOUT_SEC (default: 3)

## Local setup

1. Install dependencies:
   uv sync --group dev
2. Install optional ML dependencies if needed:
   uv sync --group dev --extra ml
3. Run server:
   uv run python main.py
4. Run tests:
   uv run pytest -q

## Notes

- CI installs only the dependencies required to run tests.
- Optional ML packages are available through the `ml` extra when needed.
