from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Any

# ── Request ──────────────────────────────────────

class AnalysisCriteria(BaseModel):

    """확정된 분석 기준 (요약 생성용 맥락)입니다."""

    analysis_type: Literal["COMPARISON", "RANKING"]
    metric_name: str
    metric_display_name: str
    standard_period: str
    compare_period: Optional[str] = Field(default=None, description="COMPARISON일 때 필수, RANKING일 때 null")
    group_by: List[str] = Field(min_length=1, description="비교 기준 축")
    sort_by: str
    sort_direction: Literal["asc", "desc"]
    limit_num: Optional[int] = Field(default=None, ge=1, description="RANKING일 때 필수, COMPARISON일 때 null")

class ChartData(BaseModel):

    """Spring이 집계 쿼리로 계산한 결과입니다."""

    columns: List[str] = Field(min_length=1, description="결과 테이블의 컬럼 순서")
    rows: List[List[Any]] = Field(description="결과 테이블의 행 데이터 (각 행 길이 = columns 길이, 비어있을 수 있음)")

class AnalysisSummaryRequest(BaseModel):

    """결과 요약 요청 DTO입니다."""

    request_id: str
    analysis_criteria: AnalysisCriteria
    chart_data: ChartData
    locale: Optional[str] = Field(default="ko-KR", description="응답 description 생성 언어 (BCP 47)")

# ── Response ─────────────────────────────────────

class Segment(BaseModel):

    """자연어 요약의 단일 텍스트 세그먼트입니다."""

    text: str = Field(min_length=1, description="세그먼트 원문")
    emphasis: bool = Field(description="강조 여부 (와이어프레임의 주황색 처리)")

class Description(BaseModel):

    """강조 구간을 포함한 자연어 요약입니다."""

    segments: List[Segment] = Field(min_length=1, description="텍스트 세그먼트 배열")
    plain_text: str = Field(description="강조 없는 전체 텍스트 (export·접근성용)")

class AnalysisSummaryResponse(BaseModel):

    """결과 요약 응답 DTO입니다."""

    request_id: str
    description: Description
