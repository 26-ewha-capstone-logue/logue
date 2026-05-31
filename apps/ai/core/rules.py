from schemas.api.file_analysis import ColumnRole, SourceWarning


def date_conflict_warnings(column_roles: list[ColumnRole]) -> list[SourceWarning]:
    """graded column_roles 로부터 `DATE_FIELD_CONFLICT` 경고를 결정론적으로 도출한다.

    `semantic_role == DATE_CRITERIA` 인 컬럼이 2개 이상이면 충돌로 간주한다.
    LLM 이 채운 `primary_candidates.date_fields` 가 아니라 채점된 역할이 truth source 이며,
    `related_columns` 는 `column_roles` 순서를 따라 안정적으로 정렬된다.
    """
    date_columns = [
        role.column_name
        for role in column_roles
        if role.semantic_role == "DATE_CRITERIA"
    ]
    if len(date_columns) <= 1:
        return []
    return [
        SourceWarning(
            code="DATE_FIELD_CONFLICT",
            related_columns=date_columns,
        )
    ]
