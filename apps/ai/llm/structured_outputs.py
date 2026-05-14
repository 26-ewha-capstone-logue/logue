import json
import logging
from typing import TypeVar

from openai import AsyncOpenAI
from pydantic import BaseModel

from config.model_config import ModelConfig
from llm.retry import with_retry

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


@with_retry()
async def call_structured(
    client: AsyncOpenAI,
    config: ModelConfig,
    system_prompt: str,
    user_content: str,
    response_model: type[T],
) -> T:
    """Structured Outputs를 사용한 LLM 호출

    Args:
        client: OpenAI 클라이언트
        config: 모델 설정
        system_prompt: 시스템 프롬프트
        user_content: 사용자 입력 (JSON 문자열)
        response_model: 응답 Pydantic 모델

    Returns:
        파싱된 응답 객체
    """
    logger.info(
        "Calling LLM: model=%s, response_model=%s",
        config.model,
        response_model.__name__,
    )

    response = await client.beta.chat.completions.parse(
        model=config.model,
        temperature=config.temperature,
        max_tokens=config.max_tokens,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        response_format=response_model,
    )

    parsed = response.choices[0].message.parsed
    if parsed is None:
        refusal = response.choices[0].message.refusal
        raise ValueError(f"LLM refused to respond: {refusal}")

    logger.info(
        "LLM response received: tokens=%d/%d",
        response.usage.prompt_tokens if response.usage else 0,
        response.usage.completion_tokens if response.usage else 0,
    )

    return parsed


async def call_structured_json(
    client: AsyncOpenAI,
    config: ModelConfig,
    system_prompt: str,
    user_content: str,
) -> dict:
    """JSON 모드를 사용한 LLM 호출 (스키마 없이)"""
    logger.info("Calling LLM (JSON mode): model=%s", config.model)

    response = await client.chat.completions.create(
        model=config.model,
        temperature=config.temperature,
        max_tokens=config.max_tokens,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("LLM returned empty response")

    return json.loads(content)
