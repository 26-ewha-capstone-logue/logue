import pytest

from rules.business_validation import (
    validate_file_analysis_response,
    validate_question_analysis_response,
)
from schemas.api.file_analysis import (
    ColumnRole,
    DataStatusSummary,
    FileAnalysisRequest,
    FileAnalysisResponse,
    PrimaryCandidates,
)


def test_validate_file_analysis_response_success(sample_file_analysis_request):
    """정상 응답 검증 통과 테스트"""
    request = FileAnalysisRequest(**sample_file_analysis_request)

    column_roles = [
        ColumnRole(
            column_name=col["column_name"],
            semantic_role="DIMENSION",
            confidence=0.8,
            display_name=col["column_name"],
        )
        for col in sample_file_analysis_request["data_source"]["columns"]
    ]

    response = FileAnalysisResponse(
        request_id=request.request_id,
        column_roles=column_roles,
        data_status_summary=DataStatusSummary(
            total_rows=request.data_source.row_count,
            total_columns=request.data_source.column_count,
            primary_candidates=PrimaryCandidates(
                date_fields=[],
                measures=[],
                dimensions=[r.column_name for r in column_roles],
                status_conditions=[],
                flags=[],
                ids=[],
            ),
        ),
        warnings=[],
    )

    validate_file_analysis_response(request, response)


def test_validate_file_analysis_response_missing_column(sample_file_analysis_request):
    """누락된 컬럼 검증 실패 테스트"""
    request = FileAnalysisRequest(**sample_file_analysis_request)

    column_roles = [
        ColumnRole(
            column_name=sample_file_analysis_request["data_source"]["columns"][0]["column_name"],
            semantic_role="DIMENSION",
            confidence=0.8,
            display_name="test",
        )
    ]

    response = FileAnalysisResponse(
        request_id=request.request_id,
        column_roles=column_roles,
        data_status_summary=DataStatusSummary(
            total_rows=request.data_source.row_count,
            total_columns=request.data_source.column_count,
            primary_candidates=PrimaryCandidates(
                date_fields=[],
                measures=[],
                dimensions=[],
                status_conditions=[],
                flags=[],
                ids=[],
            ),
        ),
        warnings=[],
    )

    with pytest.raises(ValueError, match="누락된 컬럼"):
        validate_file_analysis_response(request, response)


def test_validate_file_analysis_response_row_count_mismatch(sample_file_analysis_request):
    """행 수 불일치 검증 실패 테스트"""
    request = FileAnalysisRequest(**sample_file_analysis_request)

    column_roles = [
        ColumnRole(
            column_name=col["column_name"],
            semantic_role="DIMENSION",
            confidence=0.8,
            display_name=col["column_name"],
        )
        for col in sample_file_analysis_request["data_source"]["columns"]
    ]

    response = FileAnalysisResponse(
        request_id=request.request_id,
        column_roles=column_roles,
        data_status_summary=DataStatusSummary(
            total_rows=999,
            total_columns=request.data_source.column_count,
            primary_candidates=PrimaryCandidates(
                date_fields=[],
                measures=[],
                dimensions=[],
                status_conditions=[],
                flags=[],
                ids=[],
            ),
        ),
        warnings=[],
    )

    with pytest.raises(ValueError, match="행 수 불일치"):
        validate_file_analysis_response(request, response)
