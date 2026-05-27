"""결과 요약 LLM 호출용 정규화 입력 DTO.

미팅노트 2️⃣ LLMInputDTO 정규화 원칙에 따라 LLMClient 에 전달되는 입력은 API 요청
DTO 와 별도 모델로 분리한다. 결과 요약 요청은 현재 모든 필드가 LLM 판단에 필요하므로
실질적으로 pass-through 이나, 향후 필드 추가·제거가 발생할 때 본 모듈만 갱신한다.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from schemas.api.result_summary import (
    AnalysisCriteria,
    AnalysisSummaryRequest,
    ChartData,
)


class AnalysisSummaryLLMInput(BaseModel):
    request_id: str
    analysis_criteria: AnalysisCriteria
    chart_data: ChartData
    locale: str | None = Field(default="ko-KR")

    @classmethod
    def from_request(cls, req: AnalysisSummaryRequest) -> "AnalysisSummaryLLMInput":
        return cls(
            request_id=req.request_id,
            analysis_criteria=req.analysis_criteria,
            chart_data=req.chart_data,
            locale=req.locale,
        )
