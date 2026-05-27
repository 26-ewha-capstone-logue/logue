"""LLM 호출 재시도 정책.

미팅노트 5️⃣ 실패 처리 기준: provider error · timeout · JSON parse · schema validation
실패는 1회 retry, 재실패 시 raise. business validation 실패는 LLM 재호출하지 않으므로
호출부(서비스 레이어) 가 별도로 처리한다.
"""

from __future__ import annotations

import functools
import json
import logging
from typing import Callable, ParamSpec, TypeVar

from openai import (
    APIConnectionError,
    APIError,
    APITimeoutError,
    RateLimitError,
)
from pydantic import ValidationError


logger = logging.getLogger("logue_ai")

P = ParamSpec("P")
R = TypeVar("R")


RETRYABLE_EXCEPTIONS: tuple[type[Exception], ...] = (
    APIConnectionError,
    APITimeoutError,
    RateLimitError,
    APIError,
    ValidationError,
    json.JSONDecodeError,
)


def with_retry(
    retryable: tuple[type[Exception], ...],
    *,
    max_attempts: int = 2,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """retryable 예외에 한해 max_attempts 번까지 재시도하는 데코레이터.

    `max_attempts=2` 면 최초 호출 + 1회 retry (미팅노트 기준).
    """

    def decorator(fn: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(fn)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            for attempt in range(1, max_attempts + 1):
                try:
                    return fn(*args, **kwargs)
                except retryable as exc:
                    if attempt >= max_attempts:
                        raise
                    logger.warning(
                        "LLM call attempt %d/%d failed (%s) — retrying",
                        attempt,
                        max_attempts,
                        type(exc).__name__,
                    )
            raise RuntimeError("with_retry: unreachable")  # pragma: no cover

        return wrapper

    return decorator
