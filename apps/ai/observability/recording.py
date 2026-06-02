"""LLM 호출 1회의 usage·estimated_cost_usd 를 단일 JSONL 이벤트로 emit 하는 헬퍼.

`LLMEventBuilder` + `calculate_cost_usd` 를 묶어 서비스(v1_baseline) 호출부가 한 줄로
호출 단위 비용을 기록하게 한다. 이벤트는 stdout 으로 흐르고 CloudWatch 가 수집한다.
"""

from __future__ import annotations

from typing import Protocol

from observability.cost import calculate_cost_usd
from observability.logger import LLMEventBuilder


class _Usage(Protocol):
    """record_llm_call 이 읽는 토큰 사용량 구조 (llm.client.TokenUsage 와 호환)."""

    input_tokens: int
    cached_input_tokens: int
    output_tokens: int
    total_tokens: int


def record_llm_call(
    *,
    api_name: str,
    request_id: str,
    model: str,
    temperature: float,
    max_output_tokens: int,
    usage: _Usage,
) -> None:
    """호출 단위 usage·estimated_cost_usd 이벤트 한 줄을 emit 한다.

    cost 는 `calculate_cost_usd` 단가표 기반 추정값이며, 미등록 모델은 0.0 으로 기록돼
    운영자가 단가표 누락을 알아챌 수 있게 한다.
    """
    estimated_cost_usd = calculate_cost_usd(
        model=model,
        input_tokens=usage.input_tokens,
        cached_input_tokens=usage.cached_input_tokens,
        output_tokens=usage.output_tokens,
    )
    (
        LLMEventBuilder(api_name=api_name, request_id=request_id)
        .with_llm_call(
            model=model,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
        .with_usage(
            input_tokens=usage.input_tokens,
            cached_input_tokens=usage.cached_input_tokens,
            output_tokens=usage.output_tokens,
            total_tokens=usage.total_tokens,
        )
        .with_cost(estimated_cost_usd)
        .emit()
    )
