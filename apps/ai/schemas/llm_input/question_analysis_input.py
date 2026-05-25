"""02 질문 분석 — LLM 전달용 정규화 DTO.

BE → FastAPI Request(`QuestionAnalysisRequest`)를 그대로 LLM에 넘기지 않고,
LLM 판단에 필요한 필드만 추려 토큰을 줄이고 데이터 최소화 원칙을 지킨다.

제외 필드 (회의록 결정 기준):
- `conversation_id`          — LLM 판단 불필요
- `question.previous_messages` — MVP 단발 질문만 지원
- `data_source.id`           — LLM 판단 불필요
- `catalog.flow_warning_keys[].name`    — LLM에 code만 전달
- `catalog.flow_warning_keys[].comment` — LLM에 code만 전달
"""

from typing import Any

from pydantic import BaseModel, Field

from schemas.enums import (
    AnalysisType,
    DataType,
    MetricType,
    SemanticRoleType,
)
from schemas.analysis_criteria import QuestionAnalysisRequest


# ── 컬럼 ─────────────────────────────────────────────────────────────────────


class LLMColumnInfo(BaseModel):
    """data_source.columns 한 행 — LLM 판단에 필요한 필드만."""

    column_name: str
    data_type: DataType
    semantic_role: SemanticRoleType
    null_ratio: float
    sample_values: list[Any] = Field(max_length=10)


# ── 카탈로그 ──────────────────────────────────────────────────────────────────


class LLMPredefinedMetric(BaseModel):
    """predefined_metrics 한 항목."""

    metric_name: str
    display_name: str
    metric_type: MetricType
    formula_numerator: str | None = None
    formula_denominator: str | None = None


class LLMFlowWarningKey(BaseModel):
    """flow_warning_keys — code만 전달, name/comment 제외."""

    code: str  # FlowWarningKey enum 값


class LLMCatalog(BaseModel):
    analysis_types: list[AnalysisType]
    metric_types: list[MetricType]
    predefined_metrics: list[LLMPredefinedMetric] = Field(min_length=1)
    supported_periods: list[str] = Field(min_length=1)
    flow_warning_keys: list[LLMFlowWarningKey]


# ── 최상위 LLMInputDTO ────────────────────────────────────────────────────────


class QuestionAnalysisLLMInput(BaseModel):
    """LLM user message payload 로 직렬화되는 정규화 DTO.

    `from_request()` 로 `QuestionAnalysisRequest` 에서 생성한다.
    """

    question: str
    columns: list[LLMColumnInfo]
    catalog: LLMCatalog

    @classmethod
    def from_request(cls, req: QuestionAnalysisRequest) -> "QuestionAnalysisLLMInput":
        """QuestionAnalysisRequest → QuestionAnalysisLLMInput 변환."""
        return cls(
            question=req.question.content,
            columns=[
                LLMColumnInfo(
                    column_name=c.column_name,
                    data_type=c.data_type,
                    semantic_role=c.semantic_role,
                    null_ratio=c.null_ratio,
                    sample_values=c.sample_values,
                )
                for c in req.data_source.columns
            ],
            catalog=LLMCatalog(
                analysis_types=req.catalog.analysis_types,
                metric_types=req.catalog.metric_types,
                predefined_metrics=[
                    LLMPredefinedMetric(
                        metric_name=m.metric_name,
                        display_name=m.display_name,
                        metric_type=m.metric_type,
                        formula_numerator=m.formula_numerator,
                        formula_denominator=m.formula_denominator,
                    )
                    for m in req.catalog.predefined_metrics
                ],
                supported_periods=req.catalog.supported_periods,
                flow_warning_keys=[
                    LLMFlowWarningKey(code=w.code.value)
                    for w in req.catalog.flow_warning_keys
                ],
            ),
        )