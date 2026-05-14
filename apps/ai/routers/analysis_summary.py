from fastapi import APIRouter
from schemas.analysis_summary import AnalysisSummaryRequest, AnalysisSummaryResponse
from services.analysis_summary import summarize_analysis_result

router = APIRouter(prefix="/v1/llm")

@router.post(
    "/analysis-results/describe",
    response_model=AnalysisSummaryResponse,
    summary="결과 요약",
    description="확정된 analysis_criteria와 chart_data를 받아 한 줄 자연어 설명(강조 구간 포함)을 생성합니다.",
    responses={
        200: {"description": "요약 생성 성공"},
        422: {"description": "요청 Pydantic 검증 실패 (analysis_type별 필수 필드, rows 길이 등) — 재시도 없이 FAILED 처리됨"},
        502: {"description": "LLM 응답 계약 위반 (LLM_OUTPUT_INVALID) — 재시도 없이 FAILED 처리됨"},
        500: {"description": "서버 내부 오류 — Spring 단에서 재시도"},
    },
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
