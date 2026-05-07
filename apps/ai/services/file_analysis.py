from fastapi import HTTPException

from core.rules import source_warnings
from core.validators import validate_file_analysis_response
from schemas.common import SemanticRoleType
from schemas.file_analysis import (
    ColumnRole,
    DataStatusSummary,
    FileAnalysisRequest,
    FileAnalysisResponse,
    PrimaryCandidates,
)


ROLE_BY_TYPE: dict[str, SemanticRoleType] = {
    "date": "DATE_CRITERIA",
    "datetime": "DATE_CRITERIA",
    "integer": "MEASURE",
    "double": "MEASURE",
    "boolean": "FLAG",
}


def infer_semantic_role(column_name: str, data_type: str) -> SemanticRoleType:
    lowered = column_name.lower()
    if lowered.endswith("_id") or lowered == "id":
        return "ID_CRITERIA"
    if "status" in lowered:
        return "STATUS_CONDITION"
    if data_type in ROLE_BY_TYPE:
        return ROLE_BY_TYPE[data_type]
    return "DIMENSION"


async def analyze_file(request: FileAnalysisRequest) -> FileAnalysisResponse:
    column_roles = [
        ColumnRole(
            column_name=column.column_name,
            semantic_role=infer_semantic_role(column.column_name, column.data_type),
            confidence=0.8,
            display_name=column.column_name,
        )
        for column in request.data_source.columns
    ]

    candidates = PrimaryCandidates(
        date_fields=[role.column_name for role in column_roles if role.semantic_role == "DATE_CRITERIA"],
        measures=[role.column_name for role in column_roles if role.semantic_role == "MEASURE"],
        dimensions=[role.column_name for role in column_roles if role.semantic_role == "DIMENSION"],
        status_conditions=[
            role.column_name for role in column_roles if role.semantic_role == "STATUS_CONDITION"
        ],
        flags=[role.column_name for role in column_roles if role.semantic_role == "FLAG"],
        ids=[role.column_name for role in column_roles if role.semantic_role == "ID_CRITERIA"],
    )

    response = FileAnalysisResponse(
        request_id=request.request_id,
        column_roles=column_roles,
        data_status_summary=DataStatusSummary(
            total_rows=request.data_source.row_count,
            total_columns=request.data_source.column_count,
            primary_candidates=candidates,
        ),
        warnings=source_warnings(candidates),
    )

    try:
        validate_file_analysis_response(request, response)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return response
