"""질문 분석 요청/응답 스키마.

`POST /v1/llm/analysis-criteria/resolve` 의 입력/출력을 정의한다.

검증 책임 분담:
- 본 모듈(`model_validator`) — 형태/타입/cross-field 등 LLM 호출 전후로 항상 보장되어야 할 제약
- `services/llm_output_validator.py` — LLM 응답의 참조 무결성(catalog/data_source 참조 존재 여부)
"""

from typing import Any

from pydantic import BaseModel, Field, model_validator

from .enums import (
    AnalysisType,
    DataType,
    FlowWarningKey,
    MessageRole,
    MetricType,
    Operator,
    SemanticRoleType,
    SortDirection,
)


# ---------- Request 하위 모델 ----------


class PreviousMessage(BaseModel):
    role: MessageRole
    content: str


class Question(BaseModel):
    content: str = Field(min_length=1)
    previous_messages: list[PreviousMessage] = Field(default_factory=list)


class DataSourceColumn(BaseModel):
    column_name: str
    data_type: DataType
    semantic_role: SemanticRoleType
    null_ratio: float = Field(ge=0.0, le=1.0)
    sample_values: list[Any] = Field(max_length=10)


class DataSource(BaseModel):
    id: int = Field(ge=1)
    columns: list[DataSourceColumn] = Field(min_length=1)


class PredefinedMetric(BaseModel):
    metric_name: str
    display_name: str
    metric_type: MetricType
    formula_numerator: str | None = None
    formula_denominator: str | None = None

    @model_validator(mode="after")
    def _ratio_requires_formula(self) -> "PredefinedMetric":
        if self.metric_type == MetricType.RATIO:
            if not self.formula_numerator or not self.formula_denominator:
                raise ValueError(
                    "RATIO 지표는 formula_numerator/formula_denominator 가 모두 필요합니다."
                )
        return self


class FlowWarningKeyCatalog(BaseModel):
    code: FlowWarningKey
    name: str
    comment: str


class Catalog(BaseModel):
    analysis_types: list[AnalysisType]
    metric_types: list[MetricType]
    predefined_metrics: list[PredefinedMetric] = Field(min_length=1)
    supported_periods: list[str] = Field(min_length=1)
    flow_warning_keys: list[FlowWarningKeyCatalog]


class QuestionAnalysisRequest(BaseModel):
    request_id: str
    conversation_id: int = Field(ge=1)
    question: Question
    data_source: DataSource
    catalog: Catalog


# ---------- Response 하위 모델 ----------


class Filter(BaseModel):
    field: str
    operator: Operator
    value: Any


class AnalysisCriteria(BaseModel):
    analysis_type: AnalysisType
    metric_name: str
    metric_type: MetricType
    formula_numerator: str | None = None
    formula_denominator: str | None = None
    base_date_column: str
    standard_period: str
    compare_period: str | None = None
    sort_by: str
    sort_direction: SortDirection
    group_by: list[str] = Field(min_length=1)
    limit_num: int | None = Field(default=None, ge=1)
    filters: list[Filter] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check_type_specific_constraints(self) -> "AnalysisCriteria":
        if self.analysis_type == AnalysisType.COMPARISON:
            if self.compare_period is None:
                raise ValueError("COMPARISON 분석은 compare_period 가 필요합니다.")
            if self.limit_num is not None:
                raise ValueError("COMPARISON 분석에서는 limit_num 이 사용되지 않습니다.")
        elif self.analysis_type == AnalysisType.RANKING:
            if self.limit_num is None:
                raise ValueError("RANKING 분석은 limit_num 이 필요합니다.")
            if self.compare_period is not None:
                raise ValueError("RANKING 분석에서는 compare_period 가 사용되지 않습니다.")

        if self.metric_type == MetricType.RATIO:
            if not self.formula_numerator or not self.formula_denominator:
                raise ValueError(
                    "RATIO 지표는 formula_numerator/formula_denominator 가 모두 필요합니다."
                )
        return self


class FlowColumn(BaseModel):
    column_name: str
    semantic_role: SemanticRoleType


class FlowWarning(BaseModel):
    code: FlowWarningKey
    related_fields: list[str] | None = None
    detail: str | None = None


class UnsupportedQuestion(BaseModel):
    reason: str
    detected_intent: str | None = None


class QuestionAnalysisResponse(BaseModel):
    request_id: str
    analysis_criteria: AnalysisCriteria | None = None
    flow_columns: list[FlowColumn] = Field(default_factory=list)
    warnings: list[FlowWarning] = Field(default_factory=list)
    unsupported_question: UnsupportedQuestion | None = None

    @model_validator(mode="after")
    def _exactly_one_of_criteria_or_unsupported(self) -> "QuestionAnalysisResponse":
        has_criteria = self.analysis_criteria is not None
        has_unsupported = self.unsupported_question is not None
        if has_criteria == has_unsupported:
            raise ValueError(
                "analysis_criteria 와 unsupported_question 중 정확히 하나만 채워져야 합니다."
            )
        return self
