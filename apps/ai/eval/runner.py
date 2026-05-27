"""Eval case 실행기 — case 의 input request 를 받아 service layer 직접 호출.

routers 를 통하지 않고 service layer 함수를 호출해 HTTP 오버헤드 제거.
예외는 캡처해서 RunResult.error 에 담는다 (개별 case 실패가 suite 전체를 중단시키지 않음).
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Any, Literal


SuiteName = Literal["question_analysis", "file_analysis", "result_summary"]


@dataclass
class RunResult:
    case_id: str
    suite: SuiteName
    response: dict[str, Any] | None
    error: str | None
    latency_ms: int


def run_case(suite: SuiteName, case: dict[str, Any]) -> RunResult:
    """case["input"] 을 suite 별 schema 로 검증한 뒤 service 호출. 결과 dict 또는 error 반환."""
    case_id = case.get("id", "<unknown>")
    start = time.monotonic()
    try:
        response = _dispatch(suite, case["input"])
    except Exception as exc:
        return RunResult(
            case_id=case_id,
            suite=suite,
            response=None,
            error=f"{type(exc).__name__}: {exc}",
            latency_ms=int((time.monotonic() - start) * 1000),
        )
    return RunResult(
        case_id=case_id,
        suite=suite,
        response=response,
        error=None,
        latency_ms=int((time.monotonic() - start) * 1000),
    )


def _dispatch(suite: SuiteName, input_payload: dict[str, Any]) -> dict[str, Any]:
    if suite == "question_analysis":
        return _run_question_analysis(input_payload)
    if suite == "file_analysis":
        return _run_file_analysis(input_payload)
    if suite == "result_summary":
        return _run_result_summary(input_payload)
    raise ValueError(f"알 수 없는 suite: {suite!r}")


def _run_question_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    from schemas.api.question_analysis import QuestionAnalysisRequest
    from services.analysis_criteria_service import resolve

    req = QuestionAnalysisRequest.model_validate(payload)
    response = resolve(req)
    return response.model_dump(mode="json")


def _run_file_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    from schemas.api.file_analysis import FileAnalysisRequest
    from services.file_analysis import analyze_file

    req = FileAnalysisRequest.model_validate(payload)
    response = asyncio.run(analyze_file(req))
    return response.model_dump(mode="json")


def _run_result_summary(payload: dict[str, Any]) -> dict[str, Any]:
    from schemas.api.result_summary import AnalysisSummaryRequest
    from services.analysis_summary import summarize_analysis_result

    req = AnalysisSummaryRequest.model_validate(payload)
    response = asyncio.run(summarize_analysis_result(req))
    return response.model_dump(mode="json")
