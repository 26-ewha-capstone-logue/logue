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

## 폴더 구조

```
apps/ai/
  main.py                 # FastAPI 진입점
  routers/                # API endpoint 정의
  schemas/
    api/                  # BE↔FastAPI 계약용 Request/Response DTO
    llm_input/            # LLM 전달용 정규화 DTO (*.from_request() 로 변환)
    enums.py · common.py  # 공통 enum / Literal
  services/               # API별 처리 흐름
  │  question_analysis/   # 질문분석 LLM 구현체 (버전별)
  │    v1_baseline.py     # v1: Structured Outputs 직접 호출
  │  result_summary/      # 결과 요약 LLM 구현체 (버전별)
  │    v1_baseline.py     # v1: Structured Outputs 직접 호출
  llm/                    # OpenAI 호출 공통 모듈 (LLMClient + retry + prompt_loader)
  prompts/                # system prompt 저장 (<name>_<version>.system.md)
  config/                 # 환경변수 접근 + API별 모델/temperature/token 설정
  eval/                   # LLM 출력 품질 평가 하네스 (loader · runner · scoring · CLI)
  observability/          # LLM 호출 이벤트 로깅 (stdout JSONL → CloudWatch) + cost · hashing · redaction
  rules/                  # LLM 응답 비즈니스 검증 (metric/column/warning + facade)
  core/                   # 에러·예외 핸들러·검증 헬퍼
  tests/
```

## LLM client (apps/ai/llm/)

질문분석·결과 요약 두 엔드포인트가 공유하는 OpenAI Structured Outputs 호출 boundary 입니다. 서비스 레이어는 OpenAI SDK 를 직접 다루지 않고 `LLMClient.complete_structured()` 만 호출합니다.

### 환경변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `OPENAI_API_KEY` | 없음 (필수) | OpenAI API 키. 운영은 SSM Parameter Store 에서 주입 |
| `OPENAI_TIMEOUT_SEC` | `30` | OpenAI 호출 타임아웃 (초) |
| `ANAL_LLM_MOCK` | `false` | `true` 면 질문분석·결과 요약 모두 LLM 호출 없이 결정론적 mock 응답 반환 (테스트·통합 검증용) |

### 사용 예 (서비스 레이어)

```python
from config.model_config import model_config_for
from llm import LLMClient, load_system_prompt
from schemas.api.result_summary import AnalysisSummaryResponse

cfg = model_config_for("result_summary")  # gpt-4.1-nano · 0.1 · 300
client = LLMClient()  # OPENAI_API_KEY 자동 로드
response = client.complete_structured(
    system_prompt=load_system_prompt("result_summary"),  # → prompts/result_summary_v1.system.md
    user_payload={"analysis_criteria": ..., "chart_data": ...},
    response_model=AnalysisSummaryResponse,
    **cfg.as_llm_kwargs(),
)
```

- API 별 모델·temperature·token 한도는 `config/model_config.py` 단일 출처
- system prompt 는 `prompts/<name>_<version>.system.md` 파일로 분리 — 버전업 시 `_v2.system.md` 추가 후 `load_system_prompt(name, version="v2")` 호출. `prompt_version_id()` 로 로깅용 식별자 획득
- LLM 호출 메타데이터 로깅은 `observability.LLMEventBuilder` 로 누적해 finalize 시점에 한 줄 JSONL 이벤트로 stdout emit (CloudWatch 자동 수집, 파일 I/O 없음)

| prompt 파일 | 상태 |
|---|---|
| `question_analysis_v1.system.md` | ✅ 구현 완료 |
| `result_summary_v1.system.md` | ✅ 구현 완료 |
| `file_analysis_v1.system.md` | ✅ 구현 완료 |

### 동작 규칙

- **Structured Outputs**: `response_format` 에 Pydantic 모델 클래스를 전달, OpenAI 가 schema 강제. parsed 결과를 `BaseModel` 인스턴스로 반환.
- **재시도**: `llm/retry.py` 의 `with_retry` 가 1회만 재시도 (미팅노트 5️⃣ 실패 처리). 대상: `APIConnectionError`, `APITimeoutError`, `RateLimitError`, `APIError`, `ValidationError`, `json.JSONDecodeError`.
- **예외 통과**: 모든 raise 는 그대로 서비스 레이어로 통과. 서비스 레이어가 `LLMCallFailedError` 로 래핑해 502 `LLM_CALL_FAILED` 응답으로 매핑됨.
- **빈 응답**: OpenAI 가 `parsed=None` (refusal·컨텐츠 필터) 을 반환하면 `LLMResponseEmptyError` 로 raise.

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

질문/카탈로그/데이터 소스를 받아 구조화된 분석 기준을 반환하는 LLM 엔드포인트입니다. BE가 라우터·스키마·셀프 검증·에러 응답까지 만들어 둔 상태이며, **LLM 호출 본문은 `services/question_analysis/v1_baseline.py` 에 구현되어 있습니다.**

### 엔드포인트

```
POST /v1/llm/analysis-criteria/resolve
```

- 요청/응답 스키마: `schemas/api/question_analysis.py` (`QuestionAnalysisRequest` / `QuestionAnalysisResponse`)
- LLM 입력 정규화: `schemas/llm_input/question_analysis_input.py` (`QuestionAnalysisLLMInput.from_request()`)
- 라우터: `routers/analysis_criteria.py`
- OpenAPI 스펙: `/docs` 에서 200/422/502 응답 모두 노출됨

### LLM 구현체

```text
services/analysis_criteria_service.py   ← 오케스트레이션 (resolve → validate)
services/question_analysis/
  v1_baseline.py                        ← 실제 LLM 호출 (구현 완료)
```

```python
# v1_baseline.py 흐름
llm_input = QuestionAnalysisLLMInput.from_request(req)   # 불필요 필드 제거
client.complete_structured(
    system_prompt=load_system_prompt("question_analysis"),  # prompts/question_analysis_v1.system.md
    user_payload=llm_input.model_dump(exclude={"request_id"}),
    response_model=QuestionAnalysisResponse,
    **model_config_for("question_analysis").as_llm_kwargs(),  # gpt-4.1-mini · 0.0 · 1200
)
```

- 호출 흐름: `resolve(req)` → `_call_llm()` → `v1_baseline.run()` → `validate_llm_output`
- 셀프 검증은 오케스트레이션 레이어가 자동 호출하므로 구현체에서 추가 호출 불필요
- 새 버전 시도 시 `services/question_analysis/v2_xxx.py` 추가 후 `_call_llm()` 에서 import 교체

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

## 결과 요약 API (AI 개발자 인계)

확정된 분석 기준(`analysis_criteria`)과 Spring이 집계한 `chart_data`를 받아, 와이어프레임의 "가입 전환율이 지난주 대비 낮은 순으로 채널·디바이스를 나열했어요" 같은 한 줄 자연어 설명(강조 구간 포함)을 반환하는 LLM 엔드포인트입니다. BE가 라우터·스키마·요청 검증·응답 셀프 검증·에러 응답까지 만들어 둔 상태이며, **LLM 호출 본문은 `services/result_summary/v1_baseline.py` 에 구현되어 있습니다.**

### 엔드포인트

```http
POST /v1/llm/analysis-results/describe
```

- 요청/응답 스키마: `schemas/api/result_summary.py` (`AnalysisSummaryRequest` / `AnalysisSummaryResponse`)
- LLM 입력 정규화: `schemas/llm_input/result_summary_input.py` (`AnalysisSummaryLLMInput.from_request()`)
- 라우터: `routers/analysis_summary.py`
- OpenAPI 스펙: `/docs` 에서 200/422/502/500 응답 모두 노출됨

### LLM 구현체

```text
services/analysis_summary.py          ← 오케스트레이션 (summarize → validate)
services/result_summary/
  v1_baseline.py                       ← 실제 LLM 호출 (구현 완료)
```

```python
# v1_baseline.py 흐름
llm_input = AnalysisSummaryLLMInput.from_request(req)   # 불필요 필드 제거
client.complete_structured(
    system_prompt=load_system_prompt("result_summary"),  # prompts/result_summary_v1.system.md
    user_payload=llm_input.model_dump(exclude={"request_id"}),
    response_model=AnalysisSummaryResponse,
    **model_config_for("result_summary").as_llm_kwargs(),  # gpt-4.1-nano · 0.1 · 300
)
```

- 호출 흐름: `summarize_analysis_result(req)` → `v1_baseline.run()` → `_validate_response`
- 응답 셀프 검증(`_validate_response`)은 오케스트레이션 레이어가 자동 호출하므로 구현체에서 추가 호출 불필요
- 새 버전 시도 시 `services/result_summary/v2_xxx.py` 추가 후 `summarize_analysis_result()` 에서 import 교체

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

## 파일 분석 API (AI 개발자 인계)

CSV 컬럼 메타데이터를 받아 각 컬럼의 `semantic_role` 과 `primary_candidates`, `DATE_FIELD_CONFLICT` 같은 source warning 을 반환하는 LLM 엔드포인트 `POST /v1/llm/data-sources/analyze` 입니다. 오케스트레이션은 `services/file_analysis_service.py::analyze_file()` 가 담당하고 실제 LLM 호출은 `services/file_analysis/v1_baseline.py::run()` (gpt-4.1-nano · 0.0 · 1600, system prompt `prompts/file_analysis_v1.system.md`) 에 위임됩니다. `analyze_file` 은 LLM 응답을 받은 뒤 `request_id` 를 입력값으로 덮어쓰고 `core.rules.source_warnings()` 로 `primary_candidates.date_fields` 위에서 warning 을 결정론적으로 재계산하므로, LLM 이 warning 을 빠뜨리거나 catalog 밖 코드를 만들어도 항상 안전한 응답이 나갑니다. Spring 통합 테스트는 `ANAL_LLM_MOCK=true` 를 export 한 뒤 호출하면 LLM 비용 없이 rule-based 결정론적 응답 (`_build_mock_response`) 으로 200 경로를 검증할 수 있고, 실제 LLM 호출 동작을 사전 점검할 때는 `smoke/file_analysis/` 의 페이로드 + `run.sh` 를 사용합니다 (자세한 사용법은 해당 디렉토리 README 참조).

### 에러 코드 의미 (Spring 측 분기 기준)

| HTTP | error_code | 의미 | 트리거 위치 |
|---|---|---|---|
| 422 | `REQUEST_VALIDATION_FAILED` | 입력 Pydantic 검증 실패 (catalog enum, null/unique_ratio 범위 등) | FastAPI 입력단 |
| 502 | `LLM_OUTPUT_INVALID` | LLM 응답이 요청에 없는 컬럼명을 반환한 경우 (참조 무결성 위반) | `validate_file_analysis_response` |
| 502 | `LLM_CALL_FAILED` | LLM 호출 자체 실패 (타임아웃 · 네트워크 · upstream 5xx) | `_call_llm` 예외 → `analyze_file` 가 자동 래핑 |
