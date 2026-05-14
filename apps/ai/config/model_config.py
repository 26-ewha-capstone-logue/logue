from dataclasses import dataclass
from typing import Literal

ApiName = Literal["file_analysis", "question_analysis", "result_summary"]


@dataclass(frozen=True)
class ModelConfig:
    model: str
    temperature: float
    max_tokens: int


DEFAULT_CONFIGS: dict[ApiName, ModelConfig] = {
    "file_analysis": ModelConfig(
        model="gpt-4o-mini",
        temperature=0.0,
        max_tokens=4096,
    ),
    "question_analysis": ModelConfig(
        model="gpt-4o-mini",
        temperature=0.0,
        max_tokens=4096,
    ),
    "result_summary": ModelConfig(
        model="gpt-4o-mini",
        temperature=0.3,
        max_tokens=1024,
    ),
}


def get_model_config(api_name: ApiName) -> ModelConfig:
    return DEFAULT_CONFIGS[api_name]
