from fastapi import APIRouter
from schemas.column import FileAnalysisRequest, FileAnalysisResponse
from services.column_ai import analyze_file

router = APIRouter(prefix="/v1/llm")

@router.post(
    "/data-sources/analyze", 
    response_model=FileAnalysisResponse,
    summary="파일 분석",
    description="CSV 컬럼 메타데이터를 받아 Semantic Role 태깅 및 소스 레벨 경고를 판단합니다.",
    responses={
        200: {"description": "분석 성공"},
        500: {"description": "서버 내부 오류"},
    }
)
async def analyze_data_source(request: FileAnalysisRequest) -> FileAnalysisResponse:
    """
    CSV 파일 분석 요청을 AI 서비스로 라우팅합니다.

    Args:
        request: 파일 분석 요청 DTO (컬럼 메타데이터, 카탈로그 포함)

    Returns:
        컬럼별 semantic role 태깅 결과 및 데이터 상태 요약
    """
    
    return await analyze_file(request)


@router.post(
    "/data-sources/analyze/cancel",
    summary="파일 분석 취소",
    description="진행 중인 파일 분석 작업을 취소합니다."
)
async def cancel_data_source_analysis() -> dict:
    # TODO: AI 담당자분이 실제 취소 로직 구현
    return {"status": "CANCELLED"}