from fastapi import APIRouter

from schemas.question_analysis import QuestionAnalysisRequest, QuestionAnalysisResponse
from services.question_analysis import resolve_analysis_criteria

router = APIRouter(prefix="/v1/llm", tags=["02 question analysis"])


@router.post(
    "/analysis-criteria/resolve",
    response_model=QuestionAnalysisResponse,
    summary="Resolve question into analysis criteria",
)
async def resolve_question_analysis(
    request: QuestionAnalysisRequest,
) -> QuestionAnalysisResponse:
    return await resolve_analysis_criteria(request)
