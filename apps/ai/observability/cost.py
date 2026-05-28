"""OpenAI 모델별 estimated_cost_usd 계산 (미팅노트 2️⃣ 단가표).

단가가 변경되면 본 모듈의 `_PRICING_PER_1M` 만 수정한다. 모델 미등록 시 0.0 반환 —
신규 모델 도입 시 명시적으로 추가하지 않으면 비용이 0 으로 잡혀 운영자 점검 유도.
"""

from __future__ import annotations


# USD per 1M tokens (미팅노트 2️⃣ 표)
_PRICING_PER_1M: dict[str, dict[str, float]] = {
    "gpt-4.1-nano": {"input": 0.10, "cached_input": 0.025, "output": 0.40},
    "gpt-4.1-mini": {"input": 0.40, "cached_input": 0.10, "output": 1.60},
    "gpt-4.1": {"input": 2.00, "cached_input": 0.50, "output": 8.00},
}


def calculate_cost_usd(
    *,
    model: str,
    input_tokens: int,
    cached_input_tokens: int = 0,
    output_tokens: int,
) -> float:
    """input · cached input · output 토큰 사용량을 USD 비용으로 환산.

    - cached_input_tokens 는 input_tokens 의 부분집합으로 가정 (OpenAI API 응답 규격)
    - 단가표에 없는 모델은 0.0 반환
    - 음수 입력은 0 으로 clamp (방어적 처리)
    """
    rates = _PRICING_PER_1M.get(model)
    if rates is None:
        return 0.0

    # cached 는 input 의 부분집합이라 input 초과 시 input 으로 clamp (이상 값 방어)
    cached = min(max(0, cached_input_tokens), max(0, input_tokens))
    non_cached_input = max(0, input_tokens) - cached
    output = max(0, output_tokens)

    cost = (
        non_cached_input * rates["input"] / 1_000_000
        + cached * rates["cached_input"] / 1_000_000
        + output * rates["output"] / 1_000_000
    )
    return round(cost, 6)
