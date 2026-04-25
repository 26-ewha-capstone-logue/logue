"""LLM 응답에 대한 셀프 검증.

Pydantic 입력 검증을 통과한 응답이라도 LLM 환각으로 의미적 결함이 남을 수 있다.
이 모듈은 라우터 반환 직전에 호출되어 두 단계로 검증한다:

1. 형태 무결성 — enum / 필수 / 상호배타 재검사 (Pydantic 우회 방어선)
2. 참조 무결성 — response 가 참조하는 식별자가 request 의 catalog/data_source 에 존재하는지

위반 시 `core.errors` 의 `LLMOutputInvalidError` / `LLMReferenceViolationError` 를 raise.
형태 위반이 있으면 참조 검증은 건너뛴다(형태가 깨져 있으면 참조는 무의미).
한 단계 안에서는 위반을 모두 모아 details 로 한 번에 report (디버깅 편의).
"""

from __future__ import annotations

from core.errors import (
    ErrorDetail,
    LLMOutputInvalidError,
    LLMReferenceViolationError,
)
from schemas.analysis_criteria import (
    AnalysisCriteria,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)
from schemas.enums import AnalysisType, MetricType


def validate_llm_output(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> None:
    """LLM 응답이 요청 카탈로그/데이터 소스와 정합한지 검증한다.

    AI 개발자는 LLM 호출 직후 이 함수 하나만 호출하면 된다.
    """

    shape_violations = _check_shape_integrity(response)
    if shape_violations:
        raise LLMOutputInvalidError(
            "LLM 응답의 형태 무결성 위반.",
            request_id=response.request_id,
            details=shape_violations,
        )

    ref_violations = _check_reference_integrity(response, request)
    if ref_violations:
        raise LLMReferenceViolationError(
            "LLM 응답의 참조 무결성 위반.",
            request_id=response.request_id,
            details=ref_violations,
        )


def _check_shape_integrity(response: QuestionAnalysisResponse) -> list[ErrorDetail]:
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


def _check_reference_integrity(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> list[ErrorDetail]:
    issues: list[ErrorDetail] = []

    column_names = {c.column_name for c in request.data_source.columns}
    metric_names = {m.metric_name for m in request.catalog.predefined_metrics}
    periods = set(request.catalog.supported_periods)
    warning_codes = {w.code for w in request.catalog.flow_warning_keys}

    criteria = response.analysis_criteria
    if criteria is not None:
        if criteria.metric_name not in metric_names:
            issues.append(ErrorDetail(
                field="analysis_criteria.metric_name",
                reason=f"'{criteria.metric_name}' 은 catalog.predefined_metrics 에 없습니다.",
            ))
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
        if criteria.standard_period not in periods:
            issues.append(ErrorDetail(
                field="analysis_criteria.standard_period",
                reason=f"'{criteria.standard_period}' 은 catalog.supported_periods 에 없습니다.",
            ))
        if criteria.compare_period is not None and criteria.compare_period not in periods:
            issues.append(ErrorDetail(
                field="analysis_criteria.compare_period",
                reason=f"'{criteria.compare_period}' 은 catalog.supported_periods 에 없습니다.",
            ))

    for w in response.warnings:
        if w.code not in warning_codes:
            issues.append(ErrorDetail(
                field="warnings[].code",
                reason=f"'{w.code}' 은 catalog.flow_warning_keys 에 없습니다.",
            ))

    return issues
