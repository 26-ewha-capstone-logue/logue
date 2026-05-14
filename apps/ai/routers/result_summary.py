from fastapi import APIRouter

from schemas.api.result_summary import AnalysisSummaryRequest, AnalysisSummaryResponse
from services.result_summary_service import summarize_result

router = APIRouter(prefix="/v1/llm", tags=["03 result summary"])


@router.post(
    "/analysis-results/describe",
    response_model=AnalysisSummaryResponse,
    summary="Describe calculated analysis result",
)
async def describe_result(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    return await summarize_result(request)
