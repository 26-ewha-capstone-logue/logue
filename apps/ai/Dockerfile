FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --frozen --no-cache

COPY main.py .
COPY config ./config
COPY core ./core
COPY llm ./llm
COPY observability ./observability
COPY prompts ./prompts
COPY routers ./routers
COPY rules ./rules
COPY schemas ./schemas
COPY services ./services

EXPOSE 8000

CMD [".venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
