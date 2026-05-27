"""services/question_analysis/v1_baseline 단위 테스트.

LLMClient 를 mock 하여 v1_baseline.run() 의:
  1. 호출 인자 — model / temperature / max_output_tokens / user_payload / system_prompt
  2. 반환값    — LLMClient 응답을 그대로 돌려주는지
  3. 예외 전파 — 래핑 없이 호출부(services 레이어)로 통과하는지
  4. smoke    — prompt 파일이 실제로 존재하는지

실제 OpenAI 호출 없음.
"""

from __future__ import annotations

import os

# v1_baseline 임포트 시 모듈 수준에서 LLMClient() 가 초기화되므로
# OPENAI_API_KEY 가 없으면 RuntimeError 가 발생한다.
# 실제 API 호출은 하지 않으므로 dummy 값으로 충분하다.
os.environ.setdefault("OPENAI_API_KEY", "sk-test-dummy-for-unit-tests")

from unittest.mock import MagicMock

import httpx
import pytest
from openai import APITimeoutError

from llm import LLMResponseEmptyError
from schemas.api.question_analysis import (
    Catalog,
    DataSource,
    DataSourceColumn,
    FlowWarningKeyCatalog,
    PredefinedMetric,
    Question,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)
from services.question_analysis import v1_baseline


# ────────────────────────────────────────────────────────────────
# helpers
# ────────────────────────────────────────────────────────────────

def _make_request() -> QuestionAnalysisRequest:
    """테스트용 최소 유효 QuestionAnalysisRequest."""
    return QuestionAnalysisRequest(
        request_id="req_test",
        conversation_id=1,
        question=Question(content="이번 주 전환율?"),
        data_source=DataSource(
            id=1,
            columns=[
                DataSourceColumn(
                    column_name="signed_at",
                    data_type="datetime",
                    semantic_role="DATE_CRITERIA",
                    null_ratio=0.0,
                    sample_values=[],
                ),
            ],
        ),
        catalog=Catalog(
            analysis_types=["COMPARISON"],
            metric_types=["RATIO"],
            predefined_metrics=[
                PredefinedMetric(
                    metric_name="cr",
                    display_name="전환율",
                    metric_type="RATIO",
                    formula_numerator="a",
                    formula_denominator="b",
                )
            ],
            supported_periods=["this_week", "last_week"],
            flow_warning_keys=[
                FlowWarningKeyCatalog(
                    code="QUESTION_DATA_MISMATCH",
                    name="질문/데이터 불일치",
                    comment="...",
                )
            ],
        ),
    )


def _make_valid_response(req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    return QuestionAnalysisResponse.model_validate({
        "request_id": req.request_id,
        "analysis_criteria": {
            "analysis_type": "COMPARISON",
            "metric_name": "cr",
            "metric_type": "RATIO",
            "formula_numerator": "a",
            "formula_denominator": "b",
            "base_date_column": "signed_at",
            "standard_period": "this_week",
            "compare_period": "last_week",
            "sort_by": "delta",
            "sort_direction": "asc",
            "group_by": ["signed_at"],
        },
        "flow_columns": [],
        "warnings": [],
    })


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

def test_run_calls_llm_with_model_gpt4_mini(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    req = _make_request()
    mock_client.complete_structured.return_value = _make_valid_response(req)

    v1_baseline.run(req)

    kwargs = mock_client.complete_structured.call_args.kwargs
    assert kwargs["model"] == "gpt-4.1-mini"


def test_run_calls_llm_with_temperature_zero(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    req = _make_request()
    mock_client.complete_structured.return_value = _make_valid_response(req)

    v1_baseline.run(req)

    kwargs = mock_client.complete_structured.call_args.kwargs
    assert kwargs["temperature"] == 0.0


def test_run_calls_llm_with_max_output_tokens_1200(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    req = _make_request()
    mock_client.complete_structured.return_value = _make_valid_response(req)

    v1_baseline.run(req)

    kwargs = mock_client.complete_structured.call_args.kwargs
    assert kwargs["max_output_tokens"] == 1200


def test_run_excludes_request_id_from_user_payload(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    """user_payload 에 request_id 가 없어야 한다 — LLM 판단에 불필요한 필드."""
    req = _make_request()
    mock_client.complete_structured.return_value = _make_valid_response(req)

    v1_baseline.run(req)

    payload = mock_client.complete_structured.call_args.kwargs["user_payload"]
    assert "request_id" not in payload


def test_run_loads_system_prompt_with_name_question_analysis(
    mock_client: MagicMock, monkeypatch: pytest.MonkeyPatch
) -> None:
    """load_system_prompt 가 "question_analysis" 이름으로 호출되는지 확인."""
    req = _make_request()
    mock_client.complete_structured.return_value = _make_valid_response(req)

    captured: dict[str, str] = {}

    def spy(name: str, version: str = "v1") -> str:
        captured["name"] = name
        return "stubbed-prompt"

    monkeypatch.setattr(v1_baseline, "load_system_prompt", spy)

    v1_baseline.run(req)

    assert captured.get("name") == "question_analysis"


# ────────────────────────────────────────────────────────────────
# 2. 반환값
# ────────────────────────────────────────────────────────────────

def test_run_returns_llm_response_as_is(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    """LLMClient 반환값을 변환 없이 그대로 돌려줘야 한다."""
    req = _make_request()
    expected = _make_valid_response(req)
    mock_client.complete_structured.return_value = expected

    result = v1_baseline.run(req)

    assert result is expected
    assert isinstance(result, QuestionAnalysisResponse)


# ────────────────────────────────────────────────────────────────
# 3. 예외 전파 (v1_baseline 은 catch 하지 않고 통과만)
# ────────────────────────────────────────────────────────────────

def test_run_propagates_llm_response_empty_error(
    mock_client: MagicMock, mock_prompt: None
) -> None:
    """LLMResponseEmptyError 는 래핑 없이 그대로 올라와야 한다.

    서비스 레이어(resolve)가 LLMCallFailedError 로 래핑하므로
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

def test_question_analysis_prompt_file_exists_and_is_non_empty() -> None:
    """`prompts/question_analysis_v1.system.md` 가 실제로 존재하고 내용이 있는지 확인."""
    from llm import load_system_prompt

    content = load_system_prompt("question_analysis")

    assert content, "prompt 파일이 비어 있습니다"
    assert len(content) > 100, "prompt 내용이 너무 짧습니다 — placeholder 가 아닌지 확인"
