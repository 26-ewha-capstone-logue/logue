"""LLMClient 단위 테스트.

OpenAI SDK 호출을 mock 하여 호출 흐름·재시도·예외 매핑을 검증한다.
실제 OPENAI_API_KEY 없이 동작.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import httpx
import pytest
from openai import APITimeoutError
from pydantic import BaseModel

from llm.client import LLMClient, LLMResponseEmptyError


class DummyResponse(BaseModel):
    message: str
    score: int


def _stub_completion(parsed: DummyResponse | None) -> MagicMock:
    completion = MagicMock()
    completion.choices = [MagicMock(message=MagicMock(parsed=parsed))]
    return completion


def _timeout_exc() -> APITimeoutError:
    request = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    return APITimeoutError(request=request)


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> LLMClient:
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    return LLMClient()


def test_complete_structured_returns_parsed_model(client: LLMClient) -> None:
    expected = DummyResponse(message="hi", score=7)
    parse_mock = MagicMock(return_value=_stub_completion(expected))
    client._client.chat.completions.parse = parse_mock  # type: ignore[attr-defined]

    result = client.complete_structured(
        system_prompt="rules",
        user_payload={"q": "x"},
        response_model=DummyResponse,
        model="gpt-4.1-nano",
        max_output_tokens=300,
    )

    assert result == expected
    call_kwargs = parse_mock.call_args.kwargs
    assert call_kwargs["model"] == "gpt-4.1-nano"
    assert call_kwargs["response_format"] is DummyResponse
    assert call_kwargs["max_tokens"] == 300
    assert call_kwargs["messages"][0] == {"role": "system", "content": "rules"}
    assert call_kwargs["messages"][1]["role"] == "user"
    assert "q" in call_kwargs["messages"][1]["content"]


def test_complete_structured_serializes_dict_user_payload_as_utf8_json(
    client: LLMClient,
) -> None:
    expected = DummyResponse(message="ok", score=1)
    parse_mock = MagicMock(return_value=_stub_completion(expected))
    client._client.chat.completions.parse = parse_mock  # type: ignore[attr-defined]

    client.complete_structured(
        system_prompt="x",
        user_payload={"질문": "이번 주 전환율?"},
        response_model=DummyResponse,
        model="gpt-4.1-nano",
    )

    user_content = parse_mock.call_args.kwargs["messages"][1]["content"]
    assert "이번 주 전환율?" in user_content


def test_complete_structured_passes_string_user_payload_as_is(
    client: LLMClient,
) -> None:
    expected = DummyResponse(message="ok", score=1)
    parse_mock = MagicMock(return_value=_stub_completion(expected))
    client._client.chat.completions.parse = parse_mock  # type: ignore[attr-defined]

    client.complete_structured(
        system_prompt="x",
        user_payload="raw user text",
        response_model=DummyResponse,
        model="gpt-4.1-nano",
    )

    assert parse_mock.call_args.kwargs["messages"][1]["content"] == "raw user text"


def test_complete_structured_raises_on_empty_parsed(client: LLMClient) -> None:
    parse_mock = MagicMock(return_value=_stub_completion(None))
    client._client.chat.completions.parse = parse_mock  # type: ignore[attr-defined]

    with pytest.raises(LLMResponseEmptyError):
        client.complete_structured(
            system_prompt="x",
            user_payload="y",
            response_model=DummyResponse,
            model="gpt-4.1-nano",
        )


def test_complete_structured_retries_once_on_timeout_then_succeeds(
    client: LLMClient,
) -> None:
    expected = DummyResponse(message="ok", score=1)
    parse_mock = MagicMock(
        side_effect=[_timeout_exc(), _stub_completion(expected)]
    )
    client._client.chat.completions.parse = parse_mock  # type: ignore[attr-defined]

    result = client.complete_structured(
        system_prompt="x",
        user_payload="y",
        response_model=DummyResponse,
        model="gpt-4.1-nano",
    )

    assert result == expected
    assert parse_mock.call_count == 2


def test_complete_structured_reraises_after_second_failure(client: LLMClient) -> None:
    parse_mock = MagicMock(side_effect=[_timeout_exc(), _timeout_exc()])
    client._client.chat.completions.parse = parse_mock  # type: ignore[attr-defined]

    with pytest.raises(APITimeoutError):
        client.complete_structured(
            system_prompt="x",
            user_payload="y",
            response_model=DummyResponse,
            model="gpt-4.1-nano",
        )

    assert parse_mock.call_count == 2


def test_complete_structured_does_not_retry_on_non_retryable_exception(
    client: LLMClient,
) -> None:
    parse_mock = MagicMock(side_effect=ValueError("not retryable"))
    client._client.chat.completions.parse = parse_mock  # type: ignore[attr-defined]

    with pytest.raises(ValueError, match="not retryable"):
        client.complete_structured(
            system_prompt="x",
            user_payload="y",
            response_model=DummyResponse,
            model="gpt-4.1-nano",
        )

    assert parse_mock.call_count == 1


def test_missing_api_key_raises_at_construction(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        LLMClient()


def test_explicit_api_key_overrides_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    client = LLMClient(api_key="explicit-key")

    assert client._client.api_key == "explicit-key"  # type: ignore[attr-defined]
