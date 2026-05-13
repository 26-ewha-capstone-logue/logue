import logging

from config.model_config import get_model_config
from config.settings import settings
from llm.client import get_openai_client
from llm.prompt_loader import load_prompt
from llm.structured_outputs import call_structured
from schemas.api.result_summary import (
    AnalysisSummaryRequest,
    AnalysisSummaryResponse,
    Description,
    DescriptionSegment,
)

logger = logging.getLogger(__name__)


async def summarize_result(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    """결과 요약 수행

    OpenAI API 키가 없으면 규칙 기반 로직으로 fallback
    """
    if settings.openai_api_key:
        try:
            return await _summarize_with_llm(request)
        except Exception as e:
            logger.warning("LLM call failed, falling back to rules: %s", e)

    return await _summarize_with_rules(request)


async def _summarize_with_llm(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    """LLM을 사용한 결과 요약"""
    client = get_openai_client()
    config = get_model_config("result_summary")
    system_prompt = load_prompt("result_summary")

    user_content = request.model_dump_json()

    from pydantic import BaseModel, Field

    class LLMDescriptionSegment(BaseModel):
        text: str
        emphasis: bool

    class LLMDescription(BaseModel):
        segments: list[LLMDescriptionSegment] = Field(min_length=1)

    result = await call_structured(
        client=client,
        config=config,
        system_prompt=system_prompt,
        user_content=user_content,
        response_model=LLMDescription,
    )

    segments = [
        DescriptionSegment(text=s.text, emphasis=s.emphasis)
        for s in result.segments
    ]
    plain_text = "".join(s.text for s in segments)

    return AnalysisSummaryResponse(
        request_id=request.request_id,
        description=Description(
            segments=segments,
            plain_text=plain_text,
        ),
    )


async def _summarize_with_rules(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    """규칙 기반 결과 요약 (mock/fallback)"""
    criteria = request.analysis_criteria
    chart_data = request.chart_data

    if not chart_data.rows:
        text = f"{criteria.standard_period} 기간 동안 데이터가 없습니다."
        return AnalysisSummaryResponse(
            request_id=request.request_id,
            description=Description(
                segments=[DescriptionSegment(text=text, emphasis=False)],
                plain_text=text,
            ),
        )

    top_row = chart_data.rows[0]
    metric_idx = -1
    for i, col in enumerate(chart_data.columns):
        if col == criteria.metric_name or col == criteria.sort_by:
            metric_idx = i
            break

    if metric_idx == -1:
        metric_idx = len(chart_data.columns) - 1

    top_value = top_row[metric_idx] if metric_idx < len(top_row) else "N/A"
    top_label = top_row[0] if top_row else "항목"

    if criteria.analysis_type == "RANKING":
        segments = [
            DescriptionSegment(text=f"{criteria.standard_period} 기준 ", emphasis=False),
            DescriptionSegment(text=f"{criteria.metric_display_name}", emphasis=True),
            DescriptionSegment(text=" 상위 항목은 ", emphasis=False),
            DescriptionSegment(text=str(top_label), emphasis=True),
            DescriptionSegment(text="이며, ", emphasis=False),
            DescriptionSegment(text=str(top_value), emphasis=True),
            DescriptionSegment(text="을 기록했습니다.", emphasis=False),
        ]
    else:
        segments = [
            DescriptionSegment(text=f"{criteria.standard_period} 기간 ", emphasis=False),
            DescriptionSegment(text=f"{criteria.metric_display_name}", emphasis=True),
            DescriptionSegment(text=" 분석 결과, ", emphasis=False),
            DescriptionSegment(text=str(top_label), emphasis=True),
            DescriptionSegment(text="의 값은 ", emphasis=False),
            DescriptionSegment(text=str(top_value), emphasis=True),
            DescriptionSegment(text="입니다.", emphasis=False),
        ]

    plain_text = "".join(s.text for s in segments)

    return AnalysisSummaryResponse(
        request_id=request.request_id,
        description=Description(
            segments=segments,
            plain_text=plain_text,
        ),
    )
