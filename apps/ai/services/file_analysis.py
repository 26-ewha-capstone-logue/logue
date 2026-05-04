import logging
from fastapi import HTTPException
from schemas.file_analysis import (
    FileAnalysisRequest, FileAnalysisResponse,
    ColumnRole, DataStatusSummary, PrimaryCandidates, Warning
)

logger = logging.getLogger("logue_ai")


def _validate_response(request: FileAnalysisRequest, response: FileAnalysisResponse) -> None:
    """
    FastAPI 응답 직전 스키마 일치 여부를 검증합니다.

    응답의 column_roles에 포함된 컬럼명이 요청의 columns에 존재하는지 확인합니다.
    불일치 시 422를 반환하여 Spring 단에서 재시도 없이 즉시 FAILED 처리되도록 합니다.

    Args:
        request: 원본 파일 분석 요청 DTO
        response: LLM이 생성한 응답 DTO

    Raises:
        HTTPException(422): 응답의 컬럼명이 요청에 없는 경우 (계약 위반)
    """
    request_column_names = {col.column_name for col in request.data_source.columns}

    for role in response.column_roles:
        if role.column_name not in request_column_names:
            logger.warning(
                "스키마 불일치 - 요청에 없는 컬럼명: request_id=%s, column_name=%s",
                request.request_id,
                role.column_name,
            )
            raise HTTPException(
                status_code=422,
                detail=f"응답의 컬럼명이 요청에 존재하지 않습니다: '{role.column_name}'"
            )


async def analyze_file(request: FileAnalysisRequest) -> FileAnalysisResponse:

    """
    CSV 컬럼 메타데이터를 분석하여 Semantic Role 태깅 및 소스 경고를 반환합니다.

    응답 직전 _validate_response()를 호출하여 스키마 일치 여부를 검증합니다.
    - 스키마 불일치: 422 반환 (Spring 단에서 재시도 없이 즉시 FAILED)
    - 서버 내부 오류: main.py의 unhandled_exception_handler가 500 반환 (Spring 단에서 재시도)

    Args:
        request: 파일 분석 요청 DTO (컬럼 메타데이터, 카탈로그 포함)

    Returns:
        컬럼별 semantic role 태깅 결과 및 데이터 상태 요약

    Raises:
        NotImplementedError: LLM 연동 구현 전 (AI 담당자분이 채워넣으면 됩니다)
    """
    
    #TODO: AI 담당자분이 이 파일에 실제 로직 채워넣으면 됩니다

    response = FileAnalysisResponse(
        request_id=request.request_id,
        column_roles=[
            ColumnRole(
                column_name=request.data_source.columns[0].column_name,
                semantic_role="DATE_CRITERIA",
                confidence=0.95,
                display_name="더미 컬럼"
            )
        ],
        data_status_summary=DataStatusSummary(
            total_rows=request.data_source.row_count,
            total_columns=request.data_source.column_count,
            primary_candidates=PrimaryCandidates(
                date_fields=[],
                measures=[],
                dimensions=[],
                status_conditions=[],
                flags=[],
                ids=[]
            )
        ),
        warnings=[]
    )

    # 응답 직전 validation
    _validate_response(request, response)

    return response