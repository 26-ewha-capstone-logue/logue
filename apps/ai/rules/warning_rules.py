"""Warning 코드 검증 (catalog 정의 안에 있는지)."""

from __future__ import annotations

from core.errors import ErrorDetail
from schemas.api.question_analysis import (
    FlowWarning,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)
from schemas.enums import FlowWarningKey


# 분석에 사용된 컬럼의 null 비율이 이 값 이상이면 CRITICAL_NULL_DETECTED 추론.
CRITICAL_NULL_RATIO_THRESHOLD = 0.5


def validate_warning_codes(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> list[ErrorDetail]:
    """warnings[].code 가 catalog.flow_warning_keys 에 정의된 코드인지."""
    issues: list[ErrorDetail] = []
    catalog_codes = {w.code for w in request.catalog.flow_warning_keys}

    for w in response.warnings:
        if w.code not in catalog_codes:
            issues.append(ErrorDetail(
                field="warnings[].code",
                reason=f"'{w.code}' 은 catalog.flow_warning_keys 에 없습니다.",
            ))

    return issues


def infer_data_warnings(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> list[FlowWarning]:
    """데이터 기반으로 CRITICAL_NULL_DETECTED warning 을 추론한다.

    analysis_criteria 가 참조하는 컬럼(base_date_column / group_by / filters[].field /
    데이터 소스 컬럼과 매칭되는 formula_numerator·denominator) 중 null_ratio 가
    임계값 이상인 컬럼이 있으면 단일 warning 을 반환한다.
    catalog.flow_warning_keys 에 CRITICAL_NULL_DETECTED 가 정의돼 있지 않으면
    추론하지 않는다 (catalog 미정의 코드는 emit 금지).
    """
    criteria = response.analysis_criteria
    if criteria is None:
        return []

    catalog_codes = {w.code for w in request.catalog.flow_warning_keys}
    if FlowWarningKey.CRITICAL_NULL_DETECTED not in catalog_codes:
        return []

    column_names = {c.column_name for c in request.data_source.columns}

    referenced: list[str] = [criteria.base_date_column]
    referenced.extend(criteria.group_by)
    referenced.extend(f.field for f in criteria.filters)
    for formula in (criteria.formula_numerator, criteria.formula_denominator):
        if formula is not None and formula in column_names:
            referenced.append(formula)

    null_ratios = {c.column_name: c.null_ratio for c in request.data_source.columns}

    offending: list[str] = []
    for name in referenced:
        ratio = null_ratios.get(name)
        if ratio is not None and ratio >= CRITICAL_NULL_RATIO_THRESHOLD:
            if name not in offending:
                offending.append(name)

    if not offending:
        return []

    return [
        FlowWarning(
            code=FlowWarningKey.CRITICAL_NULL_DETECTED,
            related_fields=offending,
            detail="분석 사용 컬럼의 null 비율이 임계값을 초과합니다.",
        )
    ]


def apply_inferred_warnings(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> None:
    """추론된 warning 을 response.warnings 에 코드 기준 dedupe 하며 추가한다.

    동일 code 가 이미 LLM 응답에 존재하면 기존 것을 유지하고 추가하지 않는다.
    """
    existing_codes = {w.code for w in response.warnings}
    for warning in infer_data_warnings(response, request):
        if warning.code not in existing_codes:
            response.warnings.append(warning)
            existing_codes.add(warning.code)
