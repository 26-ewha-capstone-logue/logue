from pydantic import BaseModel, Field, model_validator

from schemas.common import AnalysisType, SortDirection


class SummaryCriteria(BaseModel):
    analysis_type: AnalysisType
    metric_name: str
    metric_display_name: str
    standard_period: str
    compare_period: str | None = None
    group_by: list[str] = Field(min_length=1)
    sort_by: str
    sort_direction: SortDirection
    limit_num: int | None = Field(default=None, ge=1)


class ChartData(BaseModel):
    columns: list[str] = Field(min_length=1)
    rows: list[list[str | int | float | bool | None]] = []


class AnalysisSummaryRequest(BaseModel):
    request_id: str
    analysis_criteria: SummaryCriteria
    chart_data: ChartData
    locale: str = "ko-KR"


class DescriptionSegment(BaseModel):
    text: str = Field(min_length=1)
    emphasis: bool


class Description(BaseModel):
    segments: list[DescriptionSegment] = Field(min_length=1)
    plain_text: str

    @model_validator(mode="after")
    def plain_text_matches_segments(self) -> "Description":
        joined = "".join(segment.text for segment in self.segments)
        if joined != self.plain_text:
            raise ValueError("plain_text must equal concatenated segment text")
        return self


class AnalysisSummaryResponse(BaseModel):
    request_id: str
    description: Description
