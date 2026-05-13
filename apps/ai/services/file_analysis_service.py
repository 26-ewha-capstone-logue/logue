import logging

from fastapi import HTTPException

from config.model_config import get_model_config
from config.settings import settings
from llm.client import get_openai_client
from llm.prompt_loader import load_prompt
from llm.structured_outputs import call_structured
from rules.business_validation import validate_file_analysis_response
from rules.warning_rules import detect_source_warnings
from schemas.api.file_analysis import (
    ColumnRole,
    DataStatusSummary,
    FileAnalysisRequest,
    FileAnalysisResponse,
    PrimaryCandidates,
)
from schemas.enums import SemanticRoleType

logger = logging.getLogger(__name__)

ROLE_BY_TYPE: dict[str, SemanticRoleType] = {
    "date": "DATE_CRITERIA",
    "datetime": "DATE_CRITERIA",
    "integer": "MEASURE",
    "double": "MEASURE",
    "boolean": "FLAG",
}


def infer_semantic_role(column_name: str, data_type: str) -> SemanticRoleType:
    """규칙 기반 시맨틱 역할 추론 (fallback)"""
    lowered = column_name.lower()
    if lowered.endswith("_id") or lowered == "id":
        return "ID_CRITERIA"
    if "status" in lowered:
        return "STATUS_CONDITION"
    if data_type in ROLE_BY_TYPE:
        return ROLE_BY_TYPE[data_type]
    return "DIMENSION"


async def analyze_file(request: FileAnalysisRequest) -> FileAnalysisResponse:
    """파일 분석 수행

    OpenAI API 키가 없으면 규칙 기반 로직으로 fallback
    """
    if settings.openai_api_key:
        try:
            return await _analyze_with_llm(request)
        except Exception as e:
            logger.warning("LLM call failed, falling back to rules: %s", e)

    return await _analyze_with_rules(request)


async def _analyze_with_llm(request: FileAnalysisRequest) -> FileAnalysisResponse:
    """LLM을 사용한 파일 분석"""
    client = get_openai_client()
    config = get_model_config("file_analysis")
    system_prompt = load_prompt("file_analysis")

    user_content = request.model_dump_json()

    # LLM 응답 스키마 정의
    from pydantic import BaseModel, Field

    class LLMColumnRole(BaseModel):
        column_name: str
        semantic_role: SemanticRoleType
        confidence: float = Field(ge=0.0, le=1.0)
        display_name: str

    class LLMFileAnalysisOutput(BaseModel):
        column_roles: list[LLMColumnRole]

    result = await call_structured(
        client=client,
        config=config,
        system_prompt=system_prompt,
        user_content=user_content,
        response_model=LLMFileAnalysisOutput,
    )

    column_roles = [
        ColumnRole(**role.model_dump()) for role in result.column_roles
    ]

    return _build_response(request, column_roles)


async def _analyze_with_rules(request: FileAnalysisRequest) -> FileAnalysisResponse:
    """규칙 기반 파일 분석 (mock/fallback)"""
    column_roles = [
        ColumnRole(
            column_name=column.column_name,
            semantic_role=infer_semantic_role(column.column_name, column.data_type),
            confidence=0.8,
            display_name=column.column_name,
        )
        for column in request.data_source.columns
    ]

    return _build_response(request, column_roles)


def _build_response(
    request: FileAnalysisRequest,
    column_roles: list[ColumnRole],
) -> FileAnalysisResponse:
    """응답 객체 생성 및 검증"""
    candidates = PrimaryCandidates(
        date_fields=[r.column_name for r in column_roles if r.semantic_role == "DATE_CRITERIA"],
        measures=[r.column_name for r in column_roles if r.semantic_role == "MEASURE"],
        dimensions=[r.column_name for r in column_roles if r.semantic_role == "DIMENSION"],
        status_conditions=[r.column_name for r in column_roles if r.semantic_role == "STATUS_CONDITION"],
        flags=[r.column_name for r in column_roles if r.semantic_role == "FLAG"],
        ids=[r.column_name for r in column_roles if r.semantic_role == "ID_CRITERIA"],
    )

    warnings = detect_source_warnings(candidates)

    response = FileAnalysisResponse(
        request_id=request.request_id,
        column_roles=column_roles,
        data_status_summary=DataStatusSummary(
            total_rows=request.data_source.row_count,
            total_columns=request.data_source.column_count,
            primary_candidates=candidates,
        ),
        warnings=warnings,
    )

    try:
        validate_file_analysis_response(request, response)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return response
