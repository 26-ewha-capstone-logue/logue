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
    column_names = {col.column_name for col in request.data_source.columns}

    reasons: list[str] = []

    if c.metric_name not in metrics_by_name:
        reasons.append(
            f"metric_name '{c.metric_name}' 은 catalog.predefined_metrics 에 없습니다."
        )
    else:
        # 멤버십은 통과하지만 카탈로그 지표의 formula 컬럼이 data_source 에
        # 존재하지 않으면 답변 불가. (criteria 가 아닌 카탈로그 지표의 formula 를
        # 사용해 LLM 이 되돌려준 formula 를 신뢰하지 않는다.)
        metric = metrics_by_name[c.metric_name]
        for formula_column in (metric.formula_numerator, metric.formula_denominator):
            if formula_column is not None and formula_column not in column_names:
                reasons.append(
                    f"metric '{c.metric_name}' 의 formula 컬럼 '{formula_column}' "
                    "은 data_source.columns 에 없습니다."
                )
    if c.standard_period not in periods:
        reasons.append(
            f"standard_period '{c.standard_period}' 은 catalog.supported_periods 에 없습니다."
        )
    if c.compare_period is not None and c.compare_period not in periods:
        reasons.append(
            f"compare_period '{c.compare_period}' 은 catalog.supported_periods 에 없습니다."
        )
    if c.analysis_type not in analysis_types:
        reasons.append(
            f"analysis_type '{c.analysis_type}' 은 catalog.analysis_types 에 없습니다."
        )

    has_date_criteria = any(
        col.semantic_role == SemanticRoleType.DATE_CRITERIA
        for col in request.data_source.columns
    )
    if not has_date_criteria:
        reasons.append(
            "data_source.columns 에 DATE_CRITERIA 컬럼이 없어 base_date_column 을 "
            "정할 수 없습니다."
        )

    if not reasons:
        return None

    return UnsupportedQuestion(reason="; ".join(reasons), detected_intent=None)
