from pydantic import BaseModel

from schemas.enums import AnalysisType, MetricType, SemanticRoleType


class ColumnSchema(BaseModel):
    name: str
    data_type: str
    role: SemanticRoleType
    samples: list[str]


class MetricSchema(BaseModel):
    name: str
    display_name: str
    metric_type: MetricType
    numerator: str | None = None
    denominator: str | None = None


class QuestionAnalysisInput(BaseModel):
    """LLM에 전달할 질문 분석 입력 DTO"""

    question: str
    previous_context: list[str]
    columns: list[ColumnSchema]
    metrics: list[MetricSchema]
    analysis_types: list[AnalysisType]
    supported_periods: list[str]
    warning_codes: list[str]

    @classmethod
    def from_request(
        cls,
        question: str,
        previous_messages: list[dict],
        columns: list[dict],
        metrics: list[dict],
        analysis_types: list[AnalysisType],
        supported_periods: list[str],
        warning_codes: list[str],
    ) -> "QuestionAnalysisInput":
        return cls(
            question=question,
            previous_context=[
                f"{msg['role']}: {msg['content']}" for msg in previous_messages[-5:]
            ],
            columns=[
                ColumnSchema(
                    name=col["column_name"],
                    data_type=col["data_type"],
                    role=col["semantic_role"],
                    samples=[str(v) for v in col["sample_values"][:3]],
                )
                for col in columns
            ],
            metrics=[
                MetricSchema(
                    name=m["metric_name"],
                    display_name=m["display_name"],
                    metric_type=m["metric_type"],
                    numerator=m.get("formula_numerator"),
                    denominator=m.get("formula_denominator"),
                )
                for m in metrics
            ],
            analysis_types=analysis_types,
            supported_periods=supported_periods,
            warning_codes=warning_codes,
        )
