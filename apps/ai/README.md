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

## 분석 기준 도출 API (AI 개발자 인계)

질문/카탈로그/데이터 소스를 받아 구조화된 분석 기준을 반환하는 LLM 엔드포인트입니다. BE가 라우터·스키마·셀프 검증·에러 응답까지 만들어 둔 상태이므로 **AI 개발자는 LLM 호출 본문만 채우면 됩니다.**

### 엔드포인트

```
POST /v1/llm/analysis-criteria/resolve
```

- 요청/응답 스키마: `schemas/analysis_criteria.py` (`QuestionAnalysisRequest` / `QuestionAnalysisResponse`)
- 라우터: `routers/analysis_criteria.py`
- OpenAPI 스펙: `/docs` 에서 200/422/502 응답 모두 노출됨

### 채워야 할 함수 — `_call_llm`

`services/analysis_criteria_service.py`

```python
def _call_llm(req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    ...  # ← 여기만 구현
```

- 입력: `QuestionAnalysisRequest` (Pydantic 입력 검증 통과 후 전달됨)
- 반환: `QuestionAnalysisResponse` (Pydantic 모델로 정상 변환 가능해야 함)
- 호출 흐름: `resolve(req)` 가 `_call_llm` → `validate_llm_output` 순서로 자동 실행
- 셀프 검증은 BE 가 이미 호출하고 있으니 본문에서 추가 호출 불필요

### Mock 모드 (LLM 없이 통합 테스트)

```bash
ANAL_LLM_MOCK=true uv run uvicorn main:app --reload
```

`ANAL_LLM_MOCK=true` 가 설정되면 `_call_llm` 이 카탈로그/데이터 소스 식별자만 사용해 결정론적 mock 응답을 반환합니다. Spring 연동/통합 테스트에서 LLM 비용 없이 200 경로를 검증할 때 사용합니다.

### 에러 코드 의미 (Spring 측 분기 기준)

| HTTP | error_code | 의미 | 트리거 위치 |
|---|---|---|---|
| 422 | `REQUEST_VALIDATION_FAILED` | 입력 Pydantic 검증 실패 | FastAPI 입력단 |
| 502 | `LLM_OUTPUT_INVALID` | LLM 응답 형태 무결성 위반 (enum/필수/상호배타) | `validate_llm_output` |
| 502 | `LLM_REFERENCE_VIOLATION` | LLM 응답 참조 무결성 위반 (catalog/data_source 미존재 식별자) | `validate_llm_output` |
| 502 | `LLM_CALL_FAILED` | LLM 호출 자체 실패 (타임아웃·네트워크·upstream 5xx) | `_call_llm` 예외 → `resolve` 가 자동 래핑 |

응답 페이로드 형태는 `core/errors.py::ErrorResponse` 단일 모델입니다 (`request_id`, `error_code`, `message`, `details[]`).
