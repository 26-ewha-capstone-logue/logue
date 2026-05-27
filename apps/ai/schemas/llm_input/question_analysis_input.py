"""질문분석 LLM 호출용 정규화 입력 DTO.

`schemas.api.question_analysis.QuestionAnalysisRequest` 에서 LLM 판단에 불필요한
필드(미팅노트 2️⃣ 표 기준)를 제거한 형태. 서비스 레이어가 LLMClient 에 전달하기
전에 `QuestionAnalysisLLMInput.from_request()` 로 변환한다.

제외 필드:
- conversation_id
- question.previous_messages (+ role / content)
- data_source.id
- catalog.flow_warning_keys[].name, comment
"""

from __future__ import annotations

from pydantic import BaseModel

from schemas.api.question_analysis import (
    DataSourceColumn,
    PredefinedMetric,
    QuestionAnalysisRequest,
)
from schemas.enums import (
    AnalysisType,
    FlowWarningKey,
    MetricType,
)


class QuestionInput(BaseModel):
    content: str


class DataSourceInput(BaseModel):
    columns: list[DataSourceColumn]


class FlowWarningKeyCodeOnly(BaseModel):
    code: FlowWarningKey


class CatalogInput(BaseModel):
    analysis_types: list[AnalysisType]
    metric_types: list[MetricType]
    predefined_metrics: list[PredefinedMetric]
    supported_periods: list[str]
    flow_warning_keys: list[FlowWarningKeyCodeOnly]


class QuestionAnalysisLLMInput(BaseModel):
    request_id: str
    question: QuestionInput
    data_source: DataSourceInput
    catalog: CatalogInput

    @classmethod
    def from_request(cls, req: QuestionAnalysisRequest) -> "QuestionAnalysisLLMInput":
        return cls(
            request_id=req.request_id,
            question=QuestionInput(content=req.question.content),
            data_source=DataSourceInput(columns=req.data_source.columns),
            catalog=CatalogInput(
                analysis_types=req.catalog.analysis_types,
                metric_types=req.catalog.metric_types,
                predefined_metrics=req.catalog.predefined_metrics,
                supported_periods=req.catalog.supported_periods,
                flow_warning_keys=[
                    FlowWarningKeyCodeOnly(code=fwk.code)
                    for fwk in req.catalog.flow_warning_keys
                ],
            ),
        )
