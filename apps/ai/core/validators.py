from schemas.file_analysis import FileAnalysisRequest, FileAnalysisResponse


def validate_file_analysis_response(
    request: FileAnalysisRequest,
    response: FileAnalysisResponse,
) -> None:
    request_column_names = {column.column_name for column in request.data_source.columns}
    for role in response.column_roles:
        if role.column_name not in request_column_names:
            raise ValueError(f"Unknown response column: {role.column_name}")
