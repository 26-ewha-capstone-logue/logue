"""Data source 참조 검증: base_date_column / group_by / filters / flow_columns."""

from __future__ import annotations

from core.errors import ErrorDetail
from schemas.api.question_analysis import (
    AnalysisCriteria,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)


def validate_criteria_columns(
    criteria: AnalysisCriteria,
    request: QuestionAnalysisRequest,
) -> list[ErrorDetail]:
    """base_date_column / group_by / filters[].field 가 data_source.columns 에 있는지."""
    issues: list[ErrorDetail] = []
    column_names = {c.column_name for c in request.data_source.columns}

    if criteria.base_date_column not in column_names:
        issues.append(ErrorDetail(
            field="analysis_criteria.base_date_column",
            reason=f"'{criteria.base_date_column}' 은 data_source.columns 에 없습니다.",
        ))

    for col in criteria.group_by:
        if col not in column_names:
            issues.append(ErrorDetail(
                field="analysis_criteria.group_by",
                reason=f"'{col}' 은 data_source.columns 에 없습니다.",
            ))

    for f in criteria.filters:
        if f.field not in column_names:
            issues.append(ErrorDetail(
                field="analysis_criteria.filters[].field",
                reason=f"'{f.field}' 은 data_source.columns 에 없습니다.",
            ))

    return issues


def validate_flow_columns(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> list[ErrorDetail]:
    """flow_columns 의 column_name 존재 + semantic_role 일치."""
    issues: list[ErrorDetail] = []
    column_roles = {c.column_name: c.semantic_role for c in request.data_source.columns}

    for fc in response.flow_columns:
        if fc.column_name not in column_roles:
            issues.append(ErrorDetail(
                field="flow_columns[].column_name",
                reason=f"'{fc.column_name}' 은 data_source.columns 에 없습니다.",
            ))
            continue
        if fc.semantic_role != column_roles[fc.column_name]:
            issues.append(ErrorDetail(
                field="flow_columns[].semantic_role",
                reason=f"'{fc.column_name}' 의 semantic_role 이 data_source 와 일치하지 않습니다.",
            ))

    return issues
