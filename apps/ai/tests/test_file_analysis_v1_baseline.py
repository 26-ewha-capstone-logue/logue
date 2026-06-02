"""services/file_analysis/v1_baseline 단위 테스트.

LLMClient 를 mock 하여 v1_baseline.run() 의:
  1. 호출 인자 — model / temperature / max_output_tokens / user_payload / system_prompt / response_model
  2. 반환값    — LLMClient 응답을 그대로 돌려주는지
  3. 예외 전파 — 래핑 없이 호출부(services 레이어)로 통과하는지
  4. smoke    — prompt 파일이 실제로 존재하는지

실제 OpenAI 호출 없음.
"""

from __future__ import annotations

import os

# v1_baseline 임포트 시 모듈 수준에서 LLMClient() 가 초기화되지 않도록 lazy singleton
# 으로 설계돼 있지만, 일부 경로가 import 한 다음 곧바로 LLMClient() 를 호출할 가능성에
# 대비해 dummy 키를 미리 박아 둔다. 실제 API 호출은 하지 않는다.
os.environ.setdefault("OPENAI_API_KEY", "sk-test-dummy-for-unit-tests")

from unittest.mock import MagicMock

import httpx
import pytest
from openai import APITimeoutError

from llm import LLMResponseEmptyError, TokenUsage
from schemas.api.file_analysis import (
    Catalog,
    ColumnMeta,
    ColumnRole,
    DataSourceMeta,
    DataStatusSummary,
    FileAnalysisRequest,
    FileAnalysisResponse,
    PrimaryCandidates,
    SourceWarningKey,
)
from services.file_analysis import v1_baseline


# complete_structured 는 (response, TokenUsage) 를 반환한다. 호출 인자/반환 검증
# 테스트에서는 usage 값 자체가 의미 없으므로 고정 더미를 쓴다.
_USAGE = TokenUsage(
    input_tokens=100, cached_input_tokens=0, output_tokens=50, total_tokens=150
)


# ────────────────────────────────────────────────────────────────
# helpers
# ────────────────────────────────────────────────────────────────

def _make_request() -> FileAnalysisRequest:
    """테스트용 최소 유효 FileAnalysisRequest."""
    return FileAnalysisRequest(
        request_id="req_test",
        data_source=DataSourceMeta(
            file_name="signup.csv",
            row_count=10,
            column_count=2,
            columns=[
                ColumnMeta(
                    column_name="signed_at",
                    data_type="datetime",
                    null_ratio=0.0,
                    unique_ratio=1.0,
                    sample_values=["2024-01-01T00:00:00Z"],
                ),
                ColumnMeta(
                    column_name="channel",
                    data_type="string",
                    null_ratio=0.0,
                    unique_ratio=0.1,
                    sample_values=["organic"],
                ),
            ],
        ),
        catalog=Catalog(
            semantic_roles=[
                "DATE_CRITERIA",
                "MEASURE",
                "DIMENSION",
                "STATUS_CONDITION",
                "FLAG",
                "ID_CRITERIA",
            ],
            source_warning_keys=[
                SourceWarningKey(
                    code="DATE_FIELD_CONFLICT",
                    name="Date field conflict",
                    comment="Choose one date field.",
                )
            ],
        ),
    )


def _make_valid_response(req: FileAnalysisRequest) -> FileAnalysisResponse:
    return FileAnalysisResponse(
        request_id=req.request_id,
        column_roles=[
            ColumnRole(
                column_name="signed_at",
                semantic_role="DATE_CRITERIA",
                confidence=0.95,
                display_name="signed_at",
            ),
            ColumnRole(
                column_name="channel",
                semantic_role="DIMENSION",
                confidence=0.9,
                display_name="channel",
            ),
        ],
        data_status_summary=DataStatusSummary(
            total_rows=10,
            total_columns=2,
            primary_candidates=PrimaryCandidates(
                date_fields=["signed_at"],
                measures=[],
                dimensions=["channel"],
                status_conditions=[],
                flags=[],
                ids=[],
            ),
        ),
        warnings=[],
    )


def _timeout_exc() -> APITimeoutError:
    return APITimeoutError(
        request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    )


# ────────────────────────────────────────────────────────────────
# fixtures
# ────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_client(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    """모듈 수준 _client 를 MagicMock 으로 교체."""
    mock = MagicMock()
    monkeypatch.setattr(v1_baseline, "_client", mock)
    return mock


@pytest.fixture
def mock_prompt(monkeypatch: pytest.MonkeyPatch) -> None:
    """load_system_prompt 를 stub 으로 교체 (파일 I/O 없이 테스트)."""
    monkeypatch.setattr(
        v1_baseline, "load_system_prompt", lambda name, version="v1": "stubbed-prompt"
    )


# ────────────────────────────────────────────────────────────────
# 1. LLM 호출 인자 검증
# ────────────────────────────────────────────────────────────────

def test_run_calls_llm_with_model_gpt4_nano(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    req = _make_request()
    mock_client.complete_structured.return_value = (_make_valid_response(req), _USAGE)

    v1_baseline.run(req)

    kwargs = mock_client.complete_structured.call_args.kwargs
    assert kwargs["model"] == "gpt-4.1-nano"


def test_run_calls_llm_with_temperature_zero(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    req = _make_request()
    mock_client.complete_structured.return_value = (_make_valid_response(req), _USAGE)

    v1_baseline.run(req)

    kwargs = mock_client.complete_structured.call_args.kwargs
    assert kwargs["temperature"] == 0.0


def test_run_calls_llm_with_max_output_tokens_1600(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    req = _make_request()
    mock_client.complete_structured.return_value = (_make_valid_response(req), _USAGE)

    v1_baseline.run(req)

    kwargs = mock_client.complete_structured.call_args.kwargs
    assert kwargs["max_output_tokens"] == 1600


def test_run_calls_llm_with_response_model_file_analysis_response(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    """response_model 이 FileAnalysisResponse 클래스 자체여야 Structured Outputs 가 동작한다."""
    req = _make_request()
    mock_client.complete_structured.return_value = (_make_valid_response(req), _USAGE)

    v1_baseline.run(req)

    kwargs = mock_client.complete_structured.call_args.kwargs
    assert kwargs["response_model"] is FileAnalysisResponse


def test_run_excludes_request_id_from_user_payload(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    """user_payload 에 request_id 가 없어야 한다 (LLM 판단에 불필요)."""
    req = _make_request()
    mock_client.complete_structured.return_value = (_make_valid_response(req), _USAGE)

    v1_baseline.run(req)

    payload = mock_client.complete_structured.call_args.kwargs["user_payload"]
    assert "request_id" not in payload


def test_run_includes_data_source_and_catalog_in_user_payload(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    """LLM 이 판단에 사용하는 핵심 필드는 user_payload 에 포함되어야 한다."""
    req = _make_request()
    mock_client.complete_structured.return_value = (_make_valid_response(req), _USAGE)

    v1_baseline.run(req)

    payload = mock_client.complete_structured.call_args.kwargs["user_payload"]
    assert "data_source" in payload
    assert "catalog" in payload


def test_run_passes_system_prompt_from_loader(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    """load_system_prompt 의 반환값이 system_prompt kwarg 로 그대로 전달돼야 한다."""
    req = _make_request()
    mock_client.complete_structured.return_value = (_make_valid_response(req), _USAGE)

    v1_baseline.run(req)

    kwargs = mock_client.complete_structured.call_args.kwargs
    assert kwargs["system_prompt"] == "stubbed-prompt"


def test_run_loads_system_prompt_with_name_file_analysis(
    mock_client: MagicMock, monkeypatch: pytest.MonkeyPatch
) -> None:
    """load_system_prompt 가 "file_analysis" 이름으로 호출되는지 확인."""
    req = _make_request()
    mock_client.complete_structured.return_value = (_make_valid_response(req), _USAGE)

    captured: dict[str, str] = {}

    def spy(name: str, version: str = "v1") -> str:
        captured["name"] = name
        return "stubbed-prompt"

    monkeypatch.setattr(v1_baseline, "load_system_prompt", spy)

    v1_baseline.run(req)

    assert captured.get("name") == "file_analysis"


# ────────────────────────────────────────────────────────────────
# 2. 반환값
# ────────────────────────────────────────────────────────────────

def test_run_returns_llm_response_as_is(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    """LLMClient 반환값을 변환 없이 그대로 돌려줘야 한다."""
    req = _make_request()
    expected = _make_valid_response(req)
    mock_client.complete_structured.return_value = (expected, _USAGE)

    result = v1_baseline.run(req)

    assert result is expected
    assert isinstance(result, FileAnalysisResponse)


# ────────────────────────────────────────────────────────────────
# 2.5 관측 이벤트 — 호출 단위 usage·cost emit
# ────────────────────────────────────────────────────────────────

def test_run_emits_llm_call_cost_event(
    mock_client: MagicMock, mock_prompt: None, capsys: pytest.CaptureFixture[str]
) -> None:
    """실호출 경로에서 api_name·usage·estimated_cost_usd 이벤트 1줄이 emit 돼야 한다."""
    import json

    req = _make_request()
    mock_client.complete_structured.return_value = (
        _make_valid_response(req),
        TokenUsage(
            input_tokens=1000,
            cached_input_tokens=200,
            output_tokens=300,
            total_tokens=1300,
        ),
    )

    v1_baseline.run(req)

    events = [
        json.loads(line)
        for line in capsys.readouterr().out.strip().split("\n")
        if line
    ]
    llm_events = [e for e in events if e.get("event_type") == "llm_call"]
    assert len(llm_events) == 1

    event = llm_events[0]
    assert event["api_name"] == "file_analysis"
    assert event["request_id"] == "req_test"
    assert event["llm"]["model"] == "gpt-4.1-nano"
    assert event["usage"]["input_tokens"] == 1000
    assert event["usage"]["cached_input_tokens"] == 200
    assert event["usage"]["output_tokens"] == 300

    # gpt-4.1-nano: non-cached input 800*0.10 + cached 200*0.025 + output 300*0.40 (per 1M)
    expected_cost = round(
        (800 * 0.10 + 200 * 0.025 + 300 * 0.40) / 1_000_000, 6
    )
    assert event["cost"]["estimated_cost_usd"] == expected_cost


# ────────────────────────────────────────────────────────────────
# 3. 예외 전파 (v1_baseline 은 catch 하지 않고 통과만)
# ────────────────────────────────────────────────────────────────

def test_run_propagates_llm_response_empty_error(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    """LLMResponseEmptyError 는 래핑 없이 그대로 올라와야 한다.

    서비스 레이어(analyze_file)가 LLMCallFailedError 로 래핑하므로
    v1_baseline 은 catch 하지 않는다.
    """
    mock_client.complete_structured.side_effect = LLMResponseEmptyError("empty response")

    with pytest.raises(LLMResponseEmptyError):
        v1_baseline.run(_make_request())


def test_run_propagates_api_timeout_error(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    """APITimeoutError 는 래핑 없이 그대로 올라와야 한다."""
    mock_client.complete_structured.side_effect = _timeout_exc()

    with pytest.raises(APITimeoutError):
        v1_baseline.run(_make_request())


# ────────────────────────────────────────────────────────────────
# 4. smoke — prompt 파일 실제 존재 여부
# ────────────────────────────────────────────────────────────────

def test_file_analysis_prompt_file_exists_and_is_non_empty() -> None:
    """`prompts/file_analysis_v1.system.md` 가 실제로 존재하고 내용이 있는지 확인."""
    from llm import load_system_prompt

    content = load_system_prompt("file_analysis")

    assert content, "prompt 파일이 비어 있습니다"
    assert len(content) > 100, "prompt 내용이 너무 짧습니다 (placeholder 가 아닌지 확인)"
