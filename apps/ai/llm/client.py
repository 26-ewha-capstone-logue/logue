"""OpenAI Structured Outputs 기반 LLM 호출 공통 클라이언트.

질문분석·결과 요약 두 엔드포인트가 공유하는 단일 boundary. 호출부는 system prompt /
user payload / Pydantic response_model / model 식별자 / temperature / max_output_tokens
만 전달한다. OpenAI SDK 의존성은 이 모듈 안에만 가둔다 — 서비스 레이어는 SDK 예외를
직접 다루지 않고, 본 모듈이 raise 한 예외를 그대로 받아 `LLMCallFailedError` 로 래핑한다.

재시도는 `llm.retry.with_retry` 로 1회 (미팅노트 5️⃣ 실패 처리).
"""

from __future__ import annotations

import json
import logging
from typing import Any, TypeVar

from openai import OpenAI
from pydantic import BaseModel

from config.settings import openai_api_key, openai_timeout_sec
from llm.retry import RETRYABLE_EXCEPTIONS, with_retry


logger = logging.getLogger("logue_ai")

T = TypeVar("T", bound=BaseModel)


class LLMResponseEmptyError(Exception):
    """OpenAI 가 parsed=None (refusal · 컨텐츠 필터 등) 을 반환한 경우."""


class LLMClient:
    """OpenAI Structured Outputs 호출 공통 클라이언트."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        timeout_sec: float | None = None,
    ) -> None:
        resolved_key = api_key or openai_api_key()
        if not resolved_key:
            raise RuntimeError(
                "OPENAI_API_KEY 환경변수가 설정되지 않았습니다. "
                "SSM/.env 에서 키를 주입하거나 mock 모드(ANAL_LLM_MOCK=true) 로 호출하세요."
            )
        resolved_timeout = timeout_sec if timeout_sec is not None else openai_timeout_sec()
        self._client = OpenAI(api_key=resolved_key, timeout=resolved_timeout)

    @with_retry(RETRYABLE_EXCEPTIONS, max_attempts=2)
    def complete_structured(
        self,
        *,
        system_prompt: str,
        user_payload: dict[str, Any] | str,
        response_model: type[T],
        model: str,
        temperature: float = 0.0,
        max_output_tokens: int | None = None,
    ) -> T:
        """system_prompt + user_payload 를 OpenAI 에 전달해 response_model 인스턴스를 반환한다.

        - user_payload 가 dict 면 JSON 직렬화 (ensure_ascii=False — 한글 그대로)
        - response_format 에 Pydantic 모델 클래스를 전달하여 Structured Outputs 강제
        - parsed=None (refusal 등) 은 `LLMResponseEmptyError` 로 raise
        """
        user_message = (
            user_payload
            if isinstance(user_payload, str)
            else json.dumps(user_payload, ensure_ascii=False)
        )

        params: dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "temperature": temperature,
            "response_format": response_model,
        }
        if max_output_tokens is not None:
            params["max_tokens"] = max_output_tokens

        completion = self._client.chat.completions.parse(**params)
        parsed = completion.choices[0].message.parsed
        if parsed is None:
            raise LLMResponseEmptyError(
                "OpenAI 응답이 비어있습니다 (parsed=None — refusal 또는 컨텐츠 필터 가능성)."
            )
        return parsed
