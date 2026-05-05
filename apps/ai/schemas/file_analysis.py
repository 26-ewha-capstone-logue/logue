from pydantic import BaseModel, Field

from schemas.common import DataType, SemanticRoleType


class ColumnMeta(BaseModel):
    column_name: str
    data_type: DataType
    null_ratio: float = Field(ge=0.0, le=1.0)
    unique_ratio: float = Field(ge=0.0, le=1.0)
    sample_values: list[str | int | float | bool | None] = Field(max_length=10)


class DataSourceMeta(BaseModel):
    file_name: str
    row_count: int = Field(ge=0)
    column_count: int = Field(ge=0)
    columns: list[ColumnMeta] = Field(min_length=1)


class SourceWarningKey(BaseModel):
    code: str
    name: str
    comment: str


class Catalog(BaseModel):
    semantic_roles: list[SemanticRoleType]
    source_warning_keys: list[SourceWarningKey]


class FileAnalysisRequest(BaseModel):
    request_id: str
    data_source: DataSourceMeta
    catalog: Catalog


class ColumnRole(BaseModel):
    column_name: str
    semantic_role: SemanticRoleType
    confidence: float = Field(ge=0.0, le=1.0)
    display_name: str


class PrimaryCandidates(BaseModel):
    date_fields: list[str]
    measures: list[str]
    dimensions: list[str]
    status_conditions: list[str]
    flags: list[str]
    ids: list[str]


class DataStatusSummary(BaseModel):
    total_rows: int = Field(ge=0)
    total_columns: int = Field(ge=0)
    primary_candidates: PrimaryCandidates


class Warning(BaseModel):
    code: str
    related_columns: list[str] = Field(min_length=1)


class FileAnalysisResponse(BaseModel):
    request_id: str
    column_roles: list[ColumnRole] = Field(min_length=1)
    data_status_summary: DataStatusSummary
    warnings: list[Warning] = []
