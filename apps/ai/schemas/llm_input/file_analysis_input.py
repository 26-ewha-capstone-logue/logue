"""파일 분석 LLM 호출용 정규화 입력 DTO.

API 요청 DTO 와 동일 형태의 pass-through 로 유지한다 — FA 입력은 이미 BE 단에서
`row_count` / `column_count` / `null_ratio` / `unique_ratio` / `sample_values` 등
프로파일링 메타데이터만 담겨 오므로 LLM 호출 전에 추가로 trim 할 필드가 없다.

`from_request()` 는 호출부에서 `model_dump(exclude={"request_id"})` 로 LLM payload 를
구성할 때 진입점 역할을 한다 — 향후 정규화 정책 (예: file_name 마스킹, sample_values
길이 제한) 이 결정되면 본 모듈에서 처리한다.
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
