import logging
from fastapi import HTTPException
from schemas.analysis_summary import (
    AnalysisSummaryRequest, AnalysisSummaryResponse,
    Description, Segment,
)

logger = logging.getLogger("logue_ai")


def _validate_response(request: AnalysisSummaryRequest, response: AnalysisSummaryResponse) -> None:
    """
    FastAPI 응답 직전 segments↔plain_text 일치 여부를 검증합니다.

    segments[].text를 이어붙인 결과가 plain_text와 완전히 일치해야 합니다.
    불일치 시 422를 반환하여 Spring 단에서 재시도 없이 즉시 FAILED 처리되도록 합니다.

    Args:
        request: 원본 결과 요약 요청 DTO
        response: LLM이 생성한 응답 DTO

    Raises:
        HTTPException(422): segments를 이어붙인 결과가 plain_text와 다른 경우 (계약 위반)
    """
    joined = "".join(seg.text for seg in response.description.segments)
    if joined != response.description.plain_text:
        logger.warning(
            "스키마 불일치 - segments 합과 plain_text 불일치: request_id=%s",
            request.request_id,
        )
        raise HTTPException(
            status_code=422,
            detail="응답의 segments를 이어붙인 결과가 plain_text와 일치하지 않습니다."
        )


async def summarize_analysis_result(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:

    """
    분석 결과(analysis_criteria + chart_data)를 받아 한 줄 자연어 요약을 생성합니다.

    응답 직전 _validate_response()를 호출하여 스키마 일치 여부를 검증합니다.
    - 스키마 불일치: 422 반환 (Spring 단에서 재시도 없이 즉시 FAILED)
    - 서버 내부 오류: main.py의 unhandled_exception_handler가 500 반환 (Spring 단에서 재시도)

    Args:
        request: 결과 요약 요청 DTO (분석 기준, chart_data, locale 포함)

    Returns:
        강조 구간을 포함한 자연어 요약 (segments + plain_text)

    Raises:
        HTTPException(422): 응답 segments-plain_text 불일치 시
    """

    # TODO: AI 담당자분이 이 파일에 실제 LLM 호출 로직 채워넣으면 됩니다
    # 인계 가이드: docs/ai/analysis-summary-handover.md

    response = AnalysisSummaryResponse(
        request_id=request.request_id,
        description=Description(
            segments=[
                Segment(text="더미 요약: ", emphasis=False),
                Segment(text="실제 LLM 응답으로 교체 예정", emphasis=True),
                Segment(text=".", emphasis=False),
            ],
            plain_text="더미 요약: 실제 LLM 응답으로 교체 예정.",
        ),
    )

    _validate_response(request, response)

    return response
