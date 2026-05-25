"""03 결과 요약 — LLM 전달용 정규화 DTO.

BE → FastAPI Request(`AnalysisSummaryRequest`)를 그대로 LLM에 넘기지 않고,
LLM 요약 생성에 필요한 필드만 추려 토큰을 줄이고 데이터 최소화 원칙을 지킨다.

제외 필드:
- `request_id` — LLM 판단 불필요
- `locale`     — system prompt에서 한국어 출력으로 고정
"""

from typing import Any

from pydantic import BaseModel, Field

from schemas.analysis_summary import AnalysisSummaryRequest


# ── 하위 모델 ─────────────────────────────────────────────────────────────────


class LLMAnalysisCriteria(BaseModel):
    """분석 기준 맥락 — LLM이 요약 문장 생성 시 참조한다."""

    analysis_type: str          # "COMPARISON" | "RANKING"
    metric_name: str
    metric_display_name: str
    standard_period: str
    compare_period: str | None = None
    group_by: list[str]
    sort_by: str
    sort_direction: str         # "asc" | "desc"
    limit_num: int | None = None


class LLMChartData(BaseModel):
    """집계 결과 테이블 — LLM이 수치를 읽어 요약 문장을 만든다."""

    columns: list[str] = Field(min_length=1)
    rows: list[list[Any]]


# ── 최상위 LLMInputDTO ────────────────────────────────────────────────────────


class ResultSummaryLLMInput(BaseModel):
    """LLM user message payload 로 직렬화되는 정규화 DTO.

    `from_request()` 로 `AnalysisSummaryRequest` 에서 생성한다.
    """

    analysis_criteria: LLMAnalysisCriteria
    chart_data: LLMChartData

    @classmethod
    def from_request(cls, req: AnalysisSummaryRequest) -> "ResultSummaryLLMInput":
        """AnalysisSummaryRequest → ResultSummaryLLMInput 변환."""
        c = req.analysis_criteria
        return cls(
            analysis_criteria=LLMAnalysisCriteria(
                analysis_type=c.analysis_type,
                metric_name=c.metric_name,
                metric_display_name=c.metric_display_name,
                standard_period=c.standard_period,
                compare_period=c.compare_period,
                group_by=c.group_by,
                sort_by=c.sort_by,
                sort_direction=c.sort_direction,
                limit_num=c.limit_num,
            ),
            chart_data=LLMChartData(
                columns=req.chart_data.columns,
                rows=req.chart_data.rows,
            ),
        )