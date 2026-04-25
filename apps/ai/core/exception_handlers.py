"""커스텀 예외와 입력 검증 실패를 통합 `ErrorResponse` 로 매핑한다.

main.py 에서 `register_exception_handlers(app)` 한 번 호출하면 등록된다.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .errors import AppError, ErrorCode, ErrorDetail, ErrorResponse


async def _app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_response().model_dump(mode="json"),
    )


def _request_id_from_body(body: Any) -> str | None:
    if not isinstance(body, dict):
        return None
    value = body.get("request_id")
    return value if isinstance(value, str) else None


def _format_loc(loc: tuple) -> str | None:
    parts = [str(p) for p in loc if p != "body"]
    return ".".join(parts) if parts else None


async def _validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    response = ErrorResponse(
        request_id=_request_id_from_body(getattr(exc, "body", None)),
        error_code=ErrorCode.REQUEST_VALIDATION_FAILED,
        message="Request validation failed.",
        details=[
            ErrorDetail(
                field=_format_loc(err.get("loc", ())),
                reason=err.get("msg", ""),
            )
            for err in exc.errors()
        ],
    )
    return JSONResponse(status_code=422, content=response.model_dump(mode="json"))


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_error_handler)
