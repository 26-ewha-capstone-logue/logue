"""파일 분석 서비스 레이어.

`analyze_file()` 가 외부 진입점. 내부 흐름:
1. LLM 호출 → `FileAnalysisResponse` 도출 (`_call_llm` 위임)
2. LLM 응답의 `primary_candidates` 위에서 `core.rules.source_warnings()` 후처리
   — `DATE_FIELD_CONFLICT` 같은 결정론적 규칙은 코드가 truth source
3. `validate_file_analysis_response()` 로 참조 무결성 검증
4. 통과 시 response 반환

LLM 구현체는 `services.file_analysis.v1_baseline` 에 위치한다.
환경변수 `ANAL_LLM_MOCK=true` 일 때는 결정론적 mock 응답을 반환해
Spring 연동/통합 테스트가 LLM 없이도 가능하다.
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
from core.rules import source_warnings
from core.validators import validate_file_analysis_response
from schemas.common import SemanticRoleType
from schemas.api.file_analysis import (
    ColumnRole,
    DataStatusSummary,
    FileAnalysisRequest,
    FileAnalysisResponse,
    PrimaryCandidates,
)


logger = logging.getLogger("logue_ai")


async def analyze_file(request: FileAnalysisRequest) -> FileAnalysisResponse:
    """파일 분석 요청을 받아 후처리·검증을 통과한 응답을 반환한다.

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

    response = response.model_copy(update={
        "request_id": request.request_id,
        "warnings": source_warnings(response.data_status_summary.primary_candidates),
    })

    try:
        validate_file_analysis_response(request, response)
    except ValueError as exc:
        raise LLMOutputInvalidError(
            f"LLM 응답 검증 실패: {exc}",
            request_id=request.request_id,
            details=[ErrorDetail(reason=str(exc))],
        ) from exc

    return response


def _call_llm(request: FileAnalysisRequest) -> FileAnalysisResponse:
    """LLM 구현체를 호출한다.

    `ANAL_LLM_MOCK=true` 가 설정된 경우 결정론적 mock 응답을 반환한다.
    실제 LLM 호출은 `services.file_analysis.v1_baseline.run()` 에 위임한다.
    """
    if is_mock_mode():
        return _build_mock_response(request)

    from services.file_analysis.v1_baseline import run
    return run(request)


_ROLE_BY_TYPE: dict[str, SemanticRoleType] = {
    "date": "DATE_CRITERIA",
    "datetime": "DATE_CRITERIA",
    "integer": "MEASURE",
    "double": "MEASURE",
    "boolean": "FLAG",
}


def _infer_semantic_role(column_name: str, data_type: str) -> SemanticRoleType:
    lowered = column_name.lower()
    if lowered.endswith("_id") or lowered == "id":
        return "ID_CRITERIA"
    if "status" in lowered:
        return "STATUS_CONDITION"
    if data_type in _ROLE_BY_TYPE:
        return _ROLE_BY_TYPE[data_type]
    return "DIMENSION"


def _build_mock_response(request: FileAnalysisRequest) -> FileAnalysisResponse:
    """LLM 없이 결정론적 응답을 반환한다 (rule-based 추론 재활용).

    `analyze_file()` 의 후처리 단계에서 `source_warnings()` 가 warnings 를 채우므로
    여기서는 빈 배열로 둔다.
    """
    column_roles = [
        ColumnRole(
            column_name=column.column_name,
            semantic_role=_infer_semantic_role(column.column_name, column.data_type),
            confidence=0.8,
            display_name=column.column_name,
        )
        for column in request.data_source.columns
    ]

    candidates = PrimaryCandidates(
        date_fields=[r.column_name for r in column_roles if r.semantic_role == "DATE_CRITERIA"],
        measures=[r.column_name for r in column_roles if r.semantic_role == "MEASURE"],
        dimensions=[r.column_name for r in column_roles if r.semantic_role == "DIMENSION"],
        status_conditions=[r.column_name for r in column_roles if r.semantic_role == "STATUS_CONDITION"],
        flags=[r.column_name for r in column_roles if r.semantic_role == "FLAG"],
        ids=[r.column_name for r in column_roles if r.semantic_role == "ID_CRITERIA"],
    )

    return FileAnalysisResponse(
        request_id=request.request_id,
        column_roles=column_roles,
        data_status_summary=DataStatusSummary(
            total_rows=request.data_source.row_count,
            total_columns=request.data_source.column_count,
            primary_candidates=candidates,
        ),
        warnings=[],
    )
