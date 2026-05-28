"""Catalog 참조 검증: analysis_type / metric_type / metric_name / period + metric 내부 정합성."""

from __future__ import annotations

from core.errors import ErrorDetail
from schemas.api.question_analysis import (
    AnalysisCriteria,
    QuestionAnalysisRequest,
)


def validate_catalog_references(
    criteria: AnalysisCriteria,
    request: QuestionAnalysisRequest,
) -> list[ErrorDetail]:
    """analysis_type · metric_type · metric_name · period catalog 멤버십 + metric 내부 정합성."""
    issues: list[ErrorDetail] = []
    catalog = request.catalog

    if criteria.analysis_type not in set(catalog.analysis_types):
        issues.append(ErrorDetail(
            field="analysis_criteria.analysis_type",
            reason=f"'{criteria.analysis_type}' 은 catalog.analysis_types 에 없습니다.",
        ))
    if criteria.metric_type not in set(catalog.metric_types):
        issues.append(ErrorDetail(
            field="analysis_criteria.metric_type",
            reason=f"'{criteria.metric_type}' 은 catalog.metric_types 에 없습니다.",
        ))

    metric_by_name = {m.metric_name: m for m in catalog.predefined_metrics}
    metric = metric_by_name.get(criteria.metric_name)
    if metric is None:
        issues.append(ErrorDetail(
            field="analysis_criteria.metric_name",
            reason=f"'{criteria.metric_name}' 은 catalog.predefined_metrics 에 없습니다.",
        ))
    else:
        if criteria.metric_type != metric.metric_type:
            issues.append(ErrorDetail(
                field="analysis_criteria.metric_type",
                reason=f"'{criteria.metric_name}' 에 매핑된 metric_type 과 일치하지 않습니다.",
            ))
        if (
            criteria.formula_numerator != metric.formula_numerator
            or criteria.formula_denominator != metric.formula_denominator
        ):
            issues.append(ErrorDetail(
                field="analysis_criteria.formula_numerator/denominator",
                reason=f"'{criteria.metric_name}' 에 매핑된 formula 와 일치하지 않습니다.",
            ))

    periods = set(catalog.supported_periods)
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

    return issues


# TODO: metric_name 매칭 후 catalog 의 metric_type / formula_numerator / formula_denominator 를
# criteria 에 주입 (LLM 생성값 신뢰 X). 본 PR 는 검증만, 주입은 LLM 연동 시 함께 도입.
