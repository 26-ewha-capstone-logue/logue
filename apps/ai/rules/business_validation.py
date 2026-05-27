"""LLM 응답 비즈니스 검증 facade.

Pydantic schema validation 을 통과한 응답에 대해:
1. 형태 무결성 (analysis_criteria ↔ unsupported_question 상호배타 + 유형별 제약) — Pydantic 우회 방어선
2. 참조 무결성 (catalog / data_source 안에 식별자가 존재하는지)

위반 시 `LLMOutputInvalidError` (shape) / `LLMReferenceViolationError` (reference) raise.
형태 위반이 있으면 참조 검증은 건너뛴다 (형태가 깨져 있으면 참조는 무의미).
AI 개발자는 LLM 호출 직후 본 모듈의 `validate()` 만 호출하면 된다.
"""

from __future__ import annotations

from core.errors import (
    ErrorDetail,
    LLMOutputInvalidError,
    LLMReferenceViolationError,
)
from rules.column_rules import validate_criteria_columns, validate_flow_columns
from rules.metric_rules import validate_catalog_references
from rules.warning_rules import validate_warning_codes
from schemas.api.question_analysis import (
    AnalysisCriteria,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)
from schemas.enums import AnalysisType, MetricType


def validate(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> None:
    """LLM 응답이 요청 catalog/data_source 와 정합한지 검증한다."""
    shape_violations = _check_shape(response)
    if shape_violations:
        raise LLMOutputInvalidError(
            "LLM 응답의 형태 무결성 위반.",
            request_id=response.request_id,
            details=shape_violations,
        )

    ref_violations = _check_references(response, request)
    if ref_violations:
        raise LLMReferenceViolationError(
            "LLM 응답의 참조 무결성 위반.",
            request_id=response.request_id,
            details=ref_violations,
        )


def _check_shape(response: QuestionAnalysisResponse) -> list[ErrorDetail]:
    issues: list[ErrorDetail] = []

    has_criteria = response.analysis_criteria is not None
    has_unsupported = response.unsupported_question is not None
    if has_criteria == has_unsupported:
        issues.append(ErrorDetail(
            field=None,
            reason="analysis_criteria 와 unsupported_question 중 정확히 하나만 채워져야 합니다.",
        ))

    if response.analysis_criteria is not None:
        issues.extend(_check_criteria_shape(response.analysis_criteria))

    return issues


def _check_criteria_shape(c: AnalysisCriteria) -> list[ErrorDetail]:
    issues: list[ErrorDetail] = []

    if c.analysis_type == AnalysisType.COMPARISON:
        if c.compare_period is None:
            issues.append(ErrorDetail(
                field="analysis_criteria.compare_period",
                reason="COMPARISON 분석은 compare_period 가 필요합니다.",
            ))
        if c.limit_num is not None:
            issues.append(ErrorDetail(
                field="analysis_criteria.limit_num",
                reason="COMPARISON 분석에서는 limit_num 이 사용되지 않습니다.",
            ))
    elif c.analysis_type == AnalysisType.RANKING:
        if c.limit_num is None:
            issues.append(ErrorDetail(
                field="analysis_criteria.limit_num",
                reason="RANKING 분석은 limit_num 이 필요합니다.",
            ))
        if c.compare_period is not None:
            issues.append(ErrorDetail(
                field="analysis_criteria.compare_period",
                reason="RANKING 분석에서는 compare_period 가 사용되지 않습니다.",
            ))

    if c.metric_type == MetricType.RATIO:
        if not c.formula_numerator or not c.formula_denominator:
            issues.append(ErrorDetail(
                field="analysis_criteria.formula_numerator/denominator",
                reason="RATIO 지표는 formula_numerator/formula_denominator 가 모두 필요합니다.",
            ))

    return issues


def _check_references(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> list[ErrorDetail]:
    issues: list[ErrorDetail] = []

    if response.analysis_criteria is not None:
        issues.extend(validate_catalog_references(response.analysis_criteria, request))
        issues.extend(validate_criteria_columns(response.analysis_criteria, request))

    issues.extend(validate_flow_columns(response, request))
    issues.extend(validate_warning_codes(response, request))

    return issues
