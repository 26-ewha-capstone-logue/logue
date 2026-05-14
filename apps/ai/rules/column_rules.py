from schemas.api.question_analysis import DataSourceColumn
from schemas.enums import SemanticRoleType


def validate_columns(
    columns: list[DataSourceColumn],
    required_columns: list[str],
) -> list[str]:
    """필수 컬럼이 존재하는지 검증

    Returns:
        누락된 컬럼 이름 목록
    """
    available = {col.column_name for col in columns}
    return [col for col in required_columns if col not in available]


def get_columns_by_role(
    columns: list[DataSourceColumn],
    role: SemanticRoleType,
) -> list[DataSourceColumn]:
    """특정 역할의 컬럼들 조회"""
    return [col for col in columns if col.semantic_role == role]


def has_role(columns: list[DataSourceColumn], role: SemanticRoleType) -> bool:
    """특정 역할의 컬럼이 존재하는지 확인"""
    return any(col.semantic_role == role for col in columns)


def validate_filter_columns(
    columns: list[DataSourceColumn],
    filter_fields: list[str],
) -> list[str]:
    """필터에 사용된 필드가 존재하는지 검증

    Returns:
        존재하지 않는 필드 이름 목록
    """
    available = {col.column_name for col in columns}
    return [field for field in filter_fields if field not in available]
