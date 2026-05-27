"""API 별 OpenAI 모델·파라미터 설정 (미팅노트 2️⃣ API 모델 선정표).

호출부는 `model_config_for(api_name)` 으로 `ModelConfig` 를 받아 `as_llm_kwargs()` 를
LLMClient 호출에 unpack 한다 — 모델·temperature·token 한도 변경 시 본 모듈만 수정.

```python
cfg = model_config_for("question_analysis")
client.complete_structured(
    system_prompt=...,
    user_payload=...,
    response_model=QuestionAnalysisResponse,
    **cfg.as_llm_kwargs(),
)
```
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


ApiName = Literal["file_analysis", "question_analysis", "result_summary"]


@dataclass(frozen=True)
class ModelConfig:
    """LLMClient.complete_structured 에 전달되는 OpenAI 호출 파라미터 묶음."""

    model: str
    temperature: float
    max_output_tokens: int

    def as_llm_kwargs(self) -> dict[str, object]:
        """LLMClient.complete_structured kwargs 로 unpack 할 수 있는 dict 반환."""
        return {
            "model": self.model,
            "temperature": self.temperature,
            "max_output_tokens": self.max_output_tokens,
        }


_CONFIGS: dict[ApiName, ModelConfig] = {
    "file_analysis": ModelConfig(
        model="gpt-4.1-nano",
        temperature=0.0,
        max_output_tokens=1600,
    ),
    "question_analysis": ModelConfig(
        model="gpt-4.1-mini",
        temperature=0.0,
        max_output_tokens=1200,
    ),
    "result_summary": ModelConfig(
        model="gpt-4.1-nano",
        temperature=0.1,
        max_output_tokens=300,
    ),
}


def model_config_for(api_name: ApiName) -> ModelConfig:
    """API 이름으로 ModelConfig 를 조회. 미정의 이름은 KeyError 로 즉시 실패."""
    if api_name not in _CONFIGS:
        allowed = " / ".join(_CONFIGS.keys())
        raise KeyError(
            f"알 수 없는 API 이름: {api_name!r} — 허용: {allowed}"
        )
    return _CONFIGS[api_name]
