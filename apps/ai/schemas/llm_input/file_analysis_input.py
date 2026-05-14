from pydantic import BaseModel

from schemas.enums import DataType, SemanticRoleType


class ColumnInfo(BaseModel):
    name: str
    data_type: DataType
    null_ratio: float
    unique_ratio: float
    samples: list[str]


class FileAnalysisInput(BaseModel):
    """LLM에 전달할 파일 분석 입력 DTO"""

    file_name: str
    row_count: int
    columns: list[ColumnInfo]
    available_roles: list[SemanticRoleType]
    warning_codes: list[str]

    @classmethod
    def from_request(
        cls,
        file_name: str,
        row_count: int,
        columns: list[dict],
        available_roles: list[SemanticRoleType],
        warning_codes: list[str],
    ) -> "FileAnalysisInput":
        return cls(
            file_name=file_name,
            row_count=row_count,
            columns=[
                ColumnInfo(
                    name=col["column_name"],
                    data_type=col["data_type"],
                    null_ratio=col["null_ratio"],
                    unique_ratio=col["unique_ratio"],
                    samples=[str(v) for v in col["sample_values"][:5]],
                )
                for col in columns
            ],
            available_roles=available_roles,
            warning_codes=warning_codes,
        )
