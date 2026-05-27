"""LLM 호출 이벤트 emit (stdout JSONL → CloudWatch 자동 수집).

`LLMEventBuilder` 로 호출 시작 시점부터 검증·warning·error 까지 한 줄 이벤트에 누적 →
`emit()` 시점에 단일 JSONL 라인으로 stdout 으로 emit. CloudWatch 가 컨테이너 stdout 을
수집하므로 파일 I/O / 로그 디렉토리 불필요.

미팅노트 3️⃣ 로깅 필드 예시 구조와 1:1 매칭.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any


_KST = timezone(timedelta(hours=9))

_events_logger = logging.getLogger("logue_ai.events")


def emit_event(event: dict[str, Any]) -> None:
    """JSONL 이벤트 한 줄을 stdout 으로 emit. CloudWatch 가 자동 수집."""
    _events_logger.info(
        json.dumps(event, ensure_ascii=False, separators=(",", ":"))
    )


@dataclass
class LLMEventBuilder:
    """LLM 호출 1회의 메타데이터를 누적해 단일 JSONL 이벤트로 emit 한다.

    호출 순서: `__init__` → `with_*` 메서드 체이닝 → `emit()`.
    각 `with_*` 는 self 를 반환해 method chaining 지원.
    """

    api_name: str
    request_id: str
    _data: dict[str, Any] = field(default_factory=dict, init=False)

    def __post_init__(self) -> None:
        self._data = {
            "timestamp": datetime.now(_KST).isoformat(),
            "event_type": "llm_call",
            "request_id": self.request_id,
            "api_name": self.api_name,
        }

    def with_prompt_version(self, version_id: str) -> "LLMEventBuilder":
        self._data["prompt_version"] = version_id
        return self

    def with_schema_version(self, version_id: str) -> "LLMEventBuilder":
        self._data["schema_version"] = version_id
        return self

    def with_llm_call(
        self,
        *,
        model: str,
        temperature: float,
        max_output_tokens: int,
    ) -> "LLMEventBuilder":
        self._data["llm"] = {
            "model": model,
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        }
        return self

    def with_usage(
        self,
        *,
        input_tokens: int,
        cached_input_tokens: int = 0,
        output_tokens: int,
        total_tokens: int,
    ) -> "LLMEventBuilder":
        self._data["usage"] = {
            "input_tokens": input_tokens,
            "cached_input_tokens": cached_input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
        }
        return self

    def with_cost(self, estimated_cost_usd: float) -> "LLMEventBuilder":
        self._data["cost"] = {"estimated_cost_usd": estimated_cost_usd}
        return self

    def with_performance(
        self,
        *,
        latency_ms: int,
        retry_count: int = 0,
    ) -> "LLMEventBuilder":
        self._data["performance"] = {
            "latency_ms": latency_ms,
            "retry_count": retry_count,
        }
        return self

    def with_validation(
        self,
        *,
        schema_validation_status: str,
        business_validation_status: str,
    ) -> "LLMEventBuilder":
        self._data["validation"] = {
            "schema_validation_status": schema_validation_status,
            "business_validation_status": business_validation_status,
        }
        return self

    def with_warnings(self, warning_codes: list[str]) -> "LLMEventBuilder":
        self._data["warnings"] = {"warning_codes": warning_codes}
        return self

    def with_error(
        self,
        *,
        error_code: str | None,
        error_message: str | None,
    ) -> "LLMEventBuilder":
        self._data["error"] = {
            "error_code": error_code,
            "error_message": error_message,
        }
        return self

    def with_hashes(
        self,
        *,
        input_hash: str,
        output_hash: str | None = None,
    ) -> "LLMEventBuilder":
        self._data["hashes"] = {
            "input_hash": input_hash,
            "output_hash": output_hash,
        }
        return self

    def emit(self) -> None:
        """누적된 메타데이터를 단일 이벤트로 stdout 에 emit."""
        # error 필드 누락 시 null/null 로 기본 채움 (소비자 schema 안정)
        self._data.setdefault("error", {"error_code": None, "error_message": None})
        emit_event(self._data)
