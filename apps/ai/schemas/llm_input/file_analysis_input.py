"""파일 분석 LLM 호출용 정규화 입력 DTO (TBD).

01 파일 분석 API 담당자가 LLM 호출 구현 시 본 모듈을 채운다 — 현재는 API 요청 DTO 와
형태가 동일한 pass-through 모델로 두어 import 경로 컨벤션만 유지한다. 필드 정규화
정책이 결정되면 `from_request()` 와 필드를 갱신한다.
"""

from __future__ import annotations

from pydantic import BaseModel

from schemas.api.file_analysis import (
    Catalog,
    DataSourceMeta,
    FileAnalysisRequest,
)


class FileAnalysisLLMInput(BaseModel):
    request_id: str
    data_source: DataSourceMeta
    catalog: Catalog

    @classmethod
    def from_request(cls, req: FileAnalysisRequest) -> "FileAnalysisLLMInput":
        return cls(
            request_id=req.request_id,
            data_source=req.data_source,
            catalog=req.catalog,
        )
