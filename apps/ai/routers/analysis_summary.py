from fastapi import APIRouter
from schemas.analysis_summary import AnalysisSummaryRequest, AnalysisSummaryResponse
from services.analysis_summary import summarize_analysis_result

router = APIRouter(prefix="/v1/llm")

@router.post(
    "/analysis-results/describe",
    summary="결과 요약",
    description="확정된 analysis_criteria와 chart_data를 받아 한 줄 자연어 설명(강조 구간 포함)을 생성합니다.",
)
async def describe_analysis_result(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    """
    분석 결과를 자연어 한 줄로 요약합니다.

    Args:
        request: 결과 요약 요청 DTO (분석 기준, chart_data, locale 포함)

    Returns:
        강조 구간을 포함한 자연어 요약 (segments + plain_text)
    """

    return await summarize_analysis_result(request)
