"""애플리케이션 도메인 예외와 통합 에러 응답 모델.

- `ErrorCode` — Spring 이 재시도/사용자 노출 분기에 사용하는 안정 식별자.
- `ErrorResponse` — 모든 핸들링된 에러의 단일 응답 스키마.
- 커스텀 예외(`AppError` 서브클래스) — 서비스 레이어가 raise 하면
  `core.exception_handlers` 가 잡아 HTTP 응답으로 변환한다.
"""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field


class ErrorCode(StrEnum):
    """Spring 이 재시도/사용자 노출 분기에 사용하는 안정 식별자."""

    REQUEST_VALIDATION_FAILED = "REQUEST_VALIDATION_FAILED"
    LLM_OUTPUT_INVALID = "LLM_OUTPUT_INVALID"
    LLM_REFERENCE_VIOLATION = "LLM_REFERENCE_VIOLATION"
    LLM_CALL_FAILED = "LLM_CALL_FAILED"


class ErrorDetail(BaseModel):
    """단일 위반 항목."""

    field: str | None = None
    reason: str


class ErrorResponse(BaseModel):
    """통합 에러 응답 페이로드."""

    request_id: str | None = None
    error_code: ErrorCode
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)


class AppError(Exception):
    """도메인 예외 베이스. 핸들러는 이 타입을 보고 `ErrorResponse` 로 변환한다."""

    error_code: ErrorCode
    status_code: int = 500

    def __init__(
        self,
        message: str,
        *,
        request_id: str | None = None,
        details: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.request_id = request_id
        self.details = details or []

    def to_response(self) -> ErrorResponse:
        return ErrorResponse(
            request_id=self.request_id,
            error_code=self.error_code,
            message=self.message,
            details=self.details,
        )


class LLMOutputInvalidError(AppError):
    """LLM 응답의 형태 무결성 위반 (enum / 필수 필드 / 상호배타)."""

    error_code = ErrorCode.LLM_OUTPUT_INVALID
    status_code = 502


class LLMReferenceViolationError(AppError):
    """LLM 응답의 참조 무결성 위반 (catalog / data_source 내 미존재 참조)."""

    error_code = ErrorCode.LLM_REFERENCE_VIOLATION
    status_code = 502


class LLMCallFailedError(AppError):
    """LLM 호출 자체 실패 (타임아웃 · 네트워크 · upstream 5xx)."""

    error_code = ErrorCode.LLM_CALL_FAILED
    status_code = 502
