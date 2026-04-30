from pydantic import BaseModel, Field
from typing import List, Optional

# ── Request ──────────────────────────────────────

class ColumnMeta(BaseModel):

    """데이터 소스의 단일 컬럼 메타데이터입니다."""

    column_name: str
    data_type: str  # string | integer | double | datetime
    null_ratio: float = Field(ge=0.0, le=1.0, description="NULL 값 비율 (0.0 ~ 1.0)")
    unique_ratio: float = Field(ge=0.0, le=1.0, description="고유값 비율 (0.0 ~ 1.0)")
    sample_values: List[str] = Field(max_length=10, description="대표 샘플 값 (최대 10개)")

class DataSourceMeta(BaseModel):

    """분석 대상 데이터 소스의 메타데이터입니다."""

    file_name: str
    row_count: int = Field(ge=0, description="전체 행 수")
    column_count: int = Field(ge=0, description="전체 열 수")
    columns: List[ColumnMeta] = Field(min_length=1, description="컬럼 메타데이터 리스트")

class SourceWarningKey(BaseModel):

    """소스 레벨 경고 정의입니다."""

    code: str
    name: str
    comment: str

class Catalog(BaseModel):

    """Spring이 주입하는 ENUM 및 컨텍스트 카탈로그입니다."""

    semantic_roles: List[str]
    source_warning_keys: List[SourceWarningKey]

class FileAnalysisRequest(BaseModel):

    """파일 분석 요청 DTO입니다."""

    request_id: str
    data_source: DataSourceMeta
    catalog: Catalog

# ── Response ─────────────────────────────────────

class ColumnRole(BaseModel):

    """컬럼별 semantic role 태깅 결과입니다."""

    column_name: str
    semantic_role: str
    confidence: float = Field(ge=0.0, le=1.0, description="LLM 태깅 신뢰도 (0.0 ~ 1.0)")
    display_name: str

class PrimaryCandidates(BaseModel):

    """role별 주요 컬럼 후보입니다."""

    date_fields: List[str]
    measures: List[str]
    dimensions: List[str]
    status_conditions: List[str]
    flags: List[str]
    ids: List[str]

class DataStatusSummary(BaseModel):

    """데이터 상태 요약입니다."""

    total_rows: int
    total_columns: int
    primary_candidates: PrimaryCandidates

class Warning(BaseModel):

    """소스 레벨 경고입니다."""

    code: str
    related_columns: List[str] = Field(min_length=1, description="경고와 관련된 컬럼 목록")

class FileAnalysisResponse(BaseModel):

    """파일 분석 응답 DTO입니다."""

    request_id: str
    column_roles: List[ColumnRole] = Field(min_length=1)
    data_status_summary: DataStatusSummary
    warnings: List[Warning] = []