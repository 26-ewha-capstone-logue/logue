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

## 결과 요약 API (AI 개발자 인계)

확정된 분석 기준(`analysis_criteria`)과 Spring이 집계한 `chart_data`를 받아, 와이어프레임의 "가입 전환율이 지난주 대비 낮은 순으로 채널·디바이스를 나열했어요" 같은 한 줄 자연어 설명(강조 구간 포함)을 반환하는 LLM 엔드포인트입니다. BE가 라우터·스키마·요청 검증·응답 셀프 검증·에러 응답까지 만들어 둔 상태이므로 **AI 개발자는 LLM 호출 본문만 채우면 됩니다.**

### 엔드포인트

```
POST /v1/llm/analysis-results/describe
```

- 요청/응답 스키마: `schemas/analysis_summary.py` (`AnalysisSummaryRequest` / `AnalysisSummaryResponse`)
- 라우터: `routers/analysis_summary.py`
- OpenAPI 스펙: `/docs` 에서 200/422/500 응답 모두 노출됨

### 채워야 할 함수 — `summarize_analysis_result`

`services/analysis_summary.py`

```python
async def summarize_analysis_result(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    ...  # ← 여기 본문을 실제 LLM 호출로 교체
```

- 입력: `AnalysisSummaryRequest` (Pydantic 입력 검증 통과 후 전달됨)
  - COMPARISON ↔ RANKING 별 `compare_period` / `limit_num` 필수 여부, `compare_period`가 빈 문자열·공백이 아닌지, `chart_data.rows` 길이가 `columns` 길이와 일치하는지까지 이미 검증됨
- 반환: `AnalysisSummaryResponse` (`description.segments[]` + `description.plain_text`)
- 현재는 더미 응답을 반환하고 있습니다 (`services/analysis_summary.py` 함수 본문 참고). 동일한 자리에 LLM 호출을 끼우면 됩니다.
- 응답 셀프 검증(`_validate_response`)은 함수 마지막 단계에서 BE가 이미 호출하고 있으니 본문에서 추가 호출 불필요

### 강조 구간 작성 규칙

응답의 `description`은 강조 구간(`emphasis: true`)을 포함한 segment 배열과, 강조 없는 전체 문자열(`plain_text`)을 함께 반환합니다.

- `segments[].text` 를 순서대로 이어붙인 결과는 **반드시 `plain_text` 와 완전히 일치**해야 합니다 (공백·구두점 포함). 불일치 시 `_validate_response` 가 502 (`LLM_OUTPUT_INVALID`) 를 발생시킵니다.
- `segments` 는 최소 1개 이상이어야 하며, 각 `text` 는 빈 문자열 불가 (`min_length=1`).
- `emphasis: true` 구간은 와이어프레임에서 주황색 처리되는 의미 강조 영역(예: "지난주 대비 낮은 순")입니다. 강조가 필요 없으면 segment 1개에 `emphasis: false` 만 담아도 됩니다.
- `plain_text` 는 export·접근성용 평문이며, 강조 마크업 없이 전체 문장을 그대로 담아야 합니다.

### 에러 코드 의미 (Spring 측 분기 기준)

| HTTP | error_code | 의미 | 트리거 위치 | 재시도 |
|---|---|---|---|---|
| 422 | (FastAPI 기본 형식) | 요청 Pydantic 검증 실패 (analysis_type별 필수 필드, rows 길이, `compare_period` 빈 문자열 등) | FastAPI 입력단 | ❌ |
| 502 | `LLM_OUTPUT_INVALID` | 응답 segments↔plain_text 불일치 (LLM 응답 계약 위반) | `_validate_response` | ❌ (재시도 없이 FAILED) |
| 500 | (FastAPI 기본 형식) | 서버 내부 오류 (LLM 호출 실패 포함) | `main.py::unhandled_exception_handler` | ✅ (Spring 단에서 재시도) |

> 502 응답 형태: `{"detail": {"request_id": "...", "error_code": "LLM_OUTPUT_INVALID", "message": "..."}}` — 질문분석 API와 동일 컨벤션.
