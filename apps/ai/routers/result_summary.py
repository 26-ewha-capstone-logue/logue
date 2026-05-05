from fastapi import APIRouter

from schemas.result_summary import AnalysisSummaryRequest, AnalysisSummaryResponse
from services.result_summary import describe_analysis_result

router = APIRouter(prefix="/v1/llm", tags=["03 result summary"])


@router.post(
    "/analysis-results/describe",
    response_model=AnalysisSummaryResponse,
    summary="Describe calculated analysis result",
)
async def describe_result(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    return await describe_analysis_result(request)
