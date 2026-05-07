from pydantic import BaseModel, Field

from schemas.common import (
    AnalysisType,
    DataType,
    FilterOperator,
    JsonValue,
    MessageRole,
    MetricType,
    SemanticRoleType,
    SortDirection,
)


class PreviousMessage(BaseModel):
    role: MessageRole
    content: str


class QuestionContext(BaseModel):
    content: str = Field(min_length=1)
    previous_messages: list[PreviousMessage] = []


class DataSourceColumn(BaseModel):
    column_name: str
    data_type: DataType
    semantic_role: SemanticRoleType
    null_ratio: float = Field(ge=0.0, le=1.0)
    sample_values: list[str | int | float | bool | None] = Field(max_length=10)


class QuestionDataSource(BaseModel):
    id: int = Field(ge=1)
    columns: list[DataSourceColumn] = Field(min_length=1)


class PredefinedMetric(BaseModel):
    metric_name: str
    display_name: str
    metric_type: MetricType
    formula_numerator: str | None = None
    formula_denominator: str | None = None


class FlowWarningKey(BaseModel):
    code: str
    name: str
    comment: str


class QuestionCatalog(BaseModel):
    analysis_types: list[AnalysisType]
    metric_types: list[MetricType]
    predefined_metrics: list[PredefinedMetric] = Field(min_length=1)
    supported_periods: list[str] = Field(min_length=1)
    flow_warning_keys: list[FlowWarningKey]


class QuestionAnalysisRequest(BaseModel):
    request_id: str
    conversation_id: int = Field(ge=1)
    question: QuestionContext
    data_source: QuestionDataSource
    catalog: QuestionCatalog


class CriteriaFilter(BaseModel):
    field: str
    operator: FilterOperator
    value: JsonValue


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
    filters: list[CriteriaFilter] = []


class FlowColumn(BaseModel):
    column_name: str
    semantic_role: SemanticRoleType


class FlowWarning(BaseModel):
    code: str
    related_fields: list[str] = []
    detail: str | None = None


class UnsupportedQuestion(BaseModel):
    reason: str
    detected_intent: str | None = None


class QuestionAnalysisResponse(BaseModel):
    request_id: str
    analysis_criteria: AnalysisCriteria | None
    flow_columns: list[FlowColumn] = []
    warnings: list[FlowWarning] = []
    unsupported_question: UnsupportedQuestion | None
