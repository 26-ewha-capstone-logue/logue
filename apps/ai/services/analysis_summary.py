"""결과 요약 서비스 레이어.

`summarize_analysis_result()` 가 외부 진입점. 내부 흐름:
1. LLM 호출 → `AnalysisSummaryResponse` 도출 (`_call_llm` 위임)
2. `_validate_response()` 로 segments↔plain_text 계약 검증
3. 통과 시 response 반환

LLM 구현체는 `services.result_summary.v1_baseline` 에 위치한다.
환경변수 `ANAL_LLM_MOCK=true` 일 때는 결정론적 mock 응답을 반환해
Spring 연동/통합 테스트가 LLM 없이도 가능하다.

sibling (`services/analysis_criteria_service.py`) 와 동일한 응답 정책을 따른다:
- LLM 호출 자체 실패 → `LLMCallFailedError` (502 `LLM_CALL_FAILED`)
- 응답 계약 위반   → `LLMOutputInvalidError` (502 `LLM_OUTPUT_INVALID`)
- 두 경로 모두 `core.errors.ErrorResponse` Pydantic 스키마로 직렬화된다.
"""

from __future__ import annotations

import asyncio
import logging

from config.settings import is_mock_mode
from core.errors import (
    AppError,
    ErrorDetail,
    LLMCallFailedError,
    LLMOutputInvalidError,
)
from schemas.api.result_summary import (
    AnalysisSummaryRequest,
    AnalysisSummaryResponse,
    Description,
    Segment,
)


logger = logging.getLogger("logue_ai")


async def summarize_analysis_result(
    request: AnalysisSummaryRequest,
) -> AnalysisSummaryResponse:
    """분석 결과를 받아 자연어 한 줄 요약을 반환한다.

    `_call_llm` 에서 발생한 타임아웃·네트워크·upstream 5xx 등 운영 환경 예외는
    `LLMCallFailedError` 로 변환되어 502 + `LLM_CALL_FAILED` 응답으로 매핑된다.
    `AppError` 는 그대로 통과시켜 의미를 보존한다.
    """
    try:
        # 동기 LLM 호출을 threadpool 으로 오프로드 — async 이벤트 루프 블로킹 방지.
        response = await asyncio.to_thread(_call_llm, request)
    except (AppError, NotImplementedError):
        raise
    except Exception as exc:
        logger.exception("LLM 호출 실패 (request_id=%s)", request.request_id)
        raise LLMCallFailedError(
            f"LLM 호출 실패: {type(exc).__name__}",
            request_id=request.request_id,
            details=[ErrorDetail(reason="업스트림 LLM 호출 중 오류가 발생했습니다.")],
        ) from exc

    _validate_response(request, response)
    return response


def _call_llm(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    """LLM 구현체를 호출한다.

    `ANAL_LLM_MOCK=true` 가 설정된 경우 결정론적 mock 응답을 반환한다.
    실제 LLM 호출은 `services.result_summary.v1_baseline.run()` 에 위임한다.
    """
    if is_mock_mode():
        return _build_mock_response(request)

    from services.result_summary.v1_baseline import run
    return run(request)


def _validate_response(
    request: AnalysisSummaryRequest,
    response: AnalysisSummaryResponse,
) -> None:
    """FastAPI 응답 직전 segments↔plain_text 일치 여부를 검증한다.

    segments[].text 를 이어붙인 결과가 plain_text 와 정확히 일치해야 한다.
    불일치 시 `LLMOutputInvalidError` 를 raise 하여 502 + `LLM_OUTPUT_INVALID`
    응답으로 매핑되고, Spring 측은 재시도 없이 즉시 FAILED 처리한다.
    """
    joined = "".join(seg.text for seg in response.description.segments)
    if joined == response.description.plain_text:
        return

    logger.warning(
        "LLM 응답 계약 위반 - segments 합과 plain_text 불일치: request_id=%s",
        request.request_id,
    )
    raise LLMOutputInvalidError(
        "응답의 segments를 이어붙인 결과가 plain_text와 일치하지 않습니다.",
        request_id=request.request_id,
        details=[
            ErrorDetail(reason="segments[].text 합과 plain_text 가 일치해야 합니다.")
        ],
    )


def _build_mock_response(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    """LLM 없이 segments↔plain_text 계약을 만족하는 결정론적 mock."""
    return AnalysisSummaryResponse(
        request_id=request.request_id,
        description=Description(
            segments=[
                Segment(text="더미 요약: ", emphasis=False),
                Segment(text="실제 LLM 응답으로 교체 예정", emphasis=True),
                Segment(text=".", emphasis=False),
            ],
            plain_text="더미 요약: 실제 LLM 응답으로 교체 예정.",
        ),
    )
