"""분석 기준 도출 라우터 (LLM 기반).

`POST /v1/llm/analysis-criteria/resolve` — Spring 으로부터 질문/카탈로그/데이터 소스를
받아 LLM 기반으로 구조화된 분석 기준을 반환한다. 서비스는 `Depends` 로 주입되어
테스트에서 `app.dependency_overrides` 로 교체 가능하다.
"""

from __future__ import annotations

from typing import Callable

from fastapi import APIRouter, Depends

from core.errors import ErrorResponse
from schemas.analysis_criteria import (
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)
from services.analysis_criteria_service import resolve as resolve_service


router = APIRouter(prefix="/v1/llm/analysis-criteria", tags=["analysis-criteria"])


def get_resolver() -> Callable[[QuestionAnalysisRequest], QuestionAnalysisResponse]:
    return resolve_service


_ERROR_RESPONSES: dict[int | str, dict] = {
    422: {
        "model": ErrorResponse,
        "description": "입력 검증 실패 — `REQUEST_VALIDATION_FAILED`",
    },
    502: {
        "model": ErrorResponse,
        "description": (
            "LLM 응답/호출 실패 — "
            "`LLM_OUTPUT_INVALID` · `LLM_REFERENCE_VIOLATION` · `LLM_CALL_FAILED`"
        ),
    },
}


@router.post(
    "/resolve",
    response_model=QuestionAnalysisResponse,
    summary="질문 분석 — 분석 기준 도출 (LLM 기반)",
    description="LLM 기반으로 질문/카탈로그/데이터 소스에서 구조화된 분석 기준을 도출합니다.",
    responses=_ERROR_RESPONSES,
)
def resolve_endpoint(
    payload: QuestionAnalysisRequest,
    resolver: Callable[[QuestionAnalysisRequest], QuestionAnalysisResponse] = Depends(get_resolver),
) -> QuestionAnalysisResponse:
    return resolver(payload)
