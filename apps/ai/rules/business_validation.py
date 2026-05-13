from schemas.api.file_analysis import FileAnalysisRequest, FileAnalysisResponse
from schemas.api.question_analysis import QuestionAnalysisRequest, QuestionAnalysisResponse


def validate_file_analysis_response(
    request: FileAnalysisRequest,
    response: FileAnalysisResponse,
) -> None:
    """파일 분석 응답 비즈니스 검증

    Raises:
        ValueError: 검증 실패 시
    """
    request_columns = {col.column_name for col in request.data_source.columns}
    response_columns = {role.column_name for role in response.column_roles}

    if request_columns != response_columns:
        missing = request_columns - response_columns
        extra = response_columns - request_columns
        errors = []
        if missing:
            errors.append(f"누락된 컬럼: {missing}")
        if extra:
            errors.append(f"잘못된 컬럼: {extra}")
        raise ValueError("; ".join(errors))

    if response.data_status_summary.total_rows != request.data_source.row_count:
        raise ValueError(
            f"행 수 불일치: expected={request.data_source.row_count}, "
            f"got={response.data_status_summary.total_rows}"
        )

    if response.data_status_summary.total_columns != request.data_source.column_count:
        raise ValueError(
            f"컬럼 수 불일치: expected={request.data_source.column_count}, "
            f"got={response.data_status_summary.total_columns}"
        )


def validate_question_analysis_response(
    request: QuestionAnalysisRequest,
    response: QuestionAnalysisResponse,
) -> None:
    """질문 분석 응답 비즈니스 검증

    Raises:
        ValueError: 검증 실패 시
    """
    if response.request_id != request.request_id:
        raise ValueError(
            f"request_id 불일치: expected={request.request_id}, got={response.request_id}"
        )

    if response.analysis_criteria is None and response.unsupported_question is None:
        raise ValueError(
            "analysis_criteria 또는 unsupported_question 중 하나는 필수입니다."
        )

    if response.analysis_criteria:
        available_columns = {col.column_name for col in request.data_source.columns}
        criteria = response.analysis_criteria

        if criteria.base_date_column not in available_columns:
            raise ValueError(f"base_date_column '{criteria.base_date_column}'이 존재하지 않습니다.")

        for col in criteria.group_by:
            if col not in available_columns:
                raise ValueError(f"group_by 컬럼 '{col}'이 존재하지 않습니다.")
