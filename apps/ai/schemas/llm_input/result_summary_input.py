from pydantic import BaseModel

from schemas.enums import AnalysisType, SortDirection


class ResultSummaryInput(BaseModel):
    """LLM에 전달할 결과 요약 입력 DTO"""

    analysis_type: AnalysisType
    metric_name: str
    metric_display_name: str
    period: str
    compare_period: str | None
    group_by: list[str]
    sort_direction: SortDirection
    limit_num: int | None
    columns: list[str]
    rows: list[list[str]]
    locale: str

    @classmethod
    def from_request(
        cls,
        criteria: dict,
        chart_data: dict,
        locale: str,
    ) -> "ResultSummaryInput":
        return cls(
            analysis_type=criteria["analysis_type"],
            metric_name=criteria["metric_name"],
            metric_display_name=criteria["metric_display_name"],
            period=criteria["standard_period"],
            compare_period=criteria.get("compare_period"),
            group_by=criteria["group_by"],
            sort_direction=criteria["sort_direction"],
            limit_num=criteria.get("limit_num"),
            columns=chart_data["columns"],
            rows=[[str(v) for v in row] for row in chart_data["rows"][:20]],
            locale=locale,
        )
