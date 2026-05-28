from fastapi import APIRouter
from schemas.api.result_summary import AnalysisSummaryRequest, AnalysisSummaryResponse
from services.analysis_summary import summarize_analysis_result

router = APIRouter(prefix="/v1/llm")

@router.post(
    "/analysis-results/describe",
    response_model=AnalysisSummaryResponse,
    summary="결과 요약 (LLM 기반)",
    description=(
        "확정된 analysis_criteria와 chart_data를 받아 LLM 으로 한 줄 자연어 설명(강조 구간 포함)을 생성합니다."
    ),
    responses={
        200: {"description": "요약 생성 성공"},
        422: {"description": "요청 Pydantic 검증 실패 (REQUEST_VALIDATION_FAILED) — 재시도 없이 FAILED 처리됨"},
        502: {
            "description": (
                "LLM 응답 계약 위반 (LLM_OUTPUT_INVALID — segments↔plain_text 불일치) "
                "또는 LLM 호출 실패 (LLM_CALL_FAILED — 타임아웃·네트워크·upstream 5xx). "
                "error_code 로 Spring 측 재시도 분기"
            )
        },
        500: {"description": "예상 외 서버 내부 오류 (LLM 외 경로)"},
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
