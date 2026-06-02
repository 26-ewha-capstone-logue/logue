"""답변 불가 질문 결정론적 backstop.

LLM 이 카탈로그(metric_name / period / analysis_type) 밖의 식별자를 담은
`analysis_criteria` 를 반환한 경우, 비즈니스 검증으로 502 를 던지는 대신
`unsupported_question` 응답으로 전환하기 위한 멤버십 기반 사전 감지기.

여기서는 "카탈로그 멤버십" 위반만 다룬다. metric_name 은 유효하지만
formula/metric_type 가 어긋난 경우는 LLM 오류이며 기존 비즈니스 검증
(`rules.business_validation`) 의 책임이므로 unsupported 로 취급하지 않는다.
"""

from __future__ import annotations

from schemas.api.question_analysis import (
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
    UnsupportedQuestion,
)
from schemas.enums import SemanticRoleType

# detected_intent 통제 어휘(controlled vocabulary). 프롬프트 PR 과 공유하며
# 임의로 늘리지 않는다. backstop 이 결정론적으로 채우는 값은 아래 일부뿐이다.
DETECTED_INTENT_CODES = (
    "unknown_metric",
    "unsupported_period",
    "missing_formula_column",
    "missing_date_criteria",
    "mixed_intent",
    "context_dependent",
    "missing_metric_type",
    "trend_request",
)


def detect_unsupported(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> UnsupportedQuestion | None:
    """카탈로그 밖 식별자로 인해 답변 불가능한 응답인지 결정론적으로 감지한다.

    `analysis_criteria` 가 없으면(이미 unsupported 등) 판단 대상이 아니므로 None.
    멤버십 위반이 하나라도 있으면 사유를 묶어 `UnsupportedQuestion` 을 반환한다.
    """
    if response.analysis_criteria is None:
        return None

    c = response.analysis_criteria
    catalog = request.catalog

    metrics_by_name = {m.metric_name: m for m in catalog.predefined_metrics}
    periods = set(catalog.supported_periods)
    analysis_types = set(catalog.analysis_types)

    reasons: list[str] = []
    # detected_intent 는 우선순위에 따라 첫 매칭 사유 1개만 채운다.
    # catalog 는 dataset-aware(dataset-b → catalog-b 등) 로 로드되므로
    # formula 컬럼명은 해당 데이터셋의 실제 컬럼명과 일치한다. formula 컬럼
    # 존재 여부를 검사해 missing_formula_column 을 결정론적으로 감지한다.
    detected_intent: str | None = None

    if c.metric_name not in metrics_by_name:
        reasons.append(
            f"metric_name '{c.metric_name}' 은 catalog.predefined_metrics 에 없습니다."
        )
        detected_intent = detected_intent or "unknown_metric"
    else:
        catalog_metric = metrics_by_name[c.metric_name]
        ds_columns = {col.column_name for col in request.data_source.columns}
        for formula_col in (catalog_metric.formula_numerator, catalog_metric.formula_denominator):
            if formula_col is not None and formula_col not in ds_columns:
                reasons.append(
                    f"catalog formula 컬럼 '{formula_col}' 이 data_source.columns 에 없습니다."
                )
                detected_intent = detected_intent or "missing_formula_column"
    if c.standard_period not in periods:
        reasons.append(
            f"standard_period '{c.standard_period}' 은 catalog.supported_periods 에 없습니다."
        )
        detected_intent = detected_intent or "unsupported_period"
    if c.compare_period is not None and c.compare_period not in periods:
        reasons.append(
            f"compare_period '{c.compare_period}' 은 catalog.supported_periods 에 없습니다."
        )
        detected_intent = detected_intent or "unsupported_period"
    if c.analysis_type not in analysis_types:
        reasons.append(
            f"analysis_type '{c.analysis_type}' 은 catalog.analysis_types 에 없습니다."
        )
        # analysis_type 단독 위반은 통제 어휘에 대응되는 detected_intent 가 없다.

    has_date_criteria = any(
        col.semantic_role == SemanticRoleType.DATE_CRITERIA
        for col in request.data_source.columns
    )
    if not has_date_criteria:
        reasons.append(
            "data_source.columns 에 DATE_CRITERIA 컬럼이 없어 base_date_column 을 "
            "정할 수 없습니다."
        )
        detected_intent = detected_intent or "missing_date_criteria"

    if not reasons:
        return None

    return UnsupportedQuestion(
        reason="; ".join(reasons), detected_intent=detected_intent
    )
