from dataclasses import dataclass

MODEL_PRICING: dict[str, tuple[float, float]] = {
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4-turbo": (10.00, 30.00),
    "gpt-3.5-turbo": (0.50, 1.50),
}


@dataclass
class TokenUsage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


def calculate_cost(
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> float:
    """토큰 사용량 기반 비용 계산 (USD)

    Args:
        model: 모델 이름
        prompt_tokens: 입력 토큰 수
        completion_tokens: 출력 토큰 수

    Returns:
        USD 비용
    """
    base_model = model.split("-")[0] + "-" + model.split("-")[1] if "-" in model else model

    for model_key, (input_price, output_price) in MODEL_PRICING.items():
        if model_key in model or model in model_key:
            input_cost = (prompt_tokens / 1_000_000) * input_price
            output_cost = (completion_tokens / 1_000_000) * output_price
            return round(input_cost + output_cost, 6)

    input_cost = (prompt_tokens / 1_000_000) * 0.15
    output_cost = (completion_tokens / 1_000_000) * 0.60
    return round(input_cost + output_cost, 6)


def format_cost(cost_usd: float) -> str:
    """비용을 읽기 쉬운 형식으로 포맷"""
    if cost_usd < 0.01:
        return f"${cost_usd:.6f}"
    return f"${cost_usd:.4f}"
