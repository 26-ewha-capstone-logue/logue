"""observability/ 단위 테스트 - cost · hashing · redaction · LLMEventBuilder."""

from __future__ import annotations

import json

import pytest

from observability import (
    LLMEventBuilder,
    calculate_cost_usd,
    emit_event,
    redact_chart_data,
    redact_data_source,
    sha256_of,
)


def _captured_events(captured_out: str) -> list[dict]:
    """capsys.readouterr().out 에서 JSONL 라인을 dict 리스트로 파싱."""
    return [json.loads(line) for line in captured_out.strip().split("\n") if line]


# ---------- cost ----------


def test_cost_gpt_4_1_nano_baseline() -> None:
    cost = calculate_cost_usd(
        model="gpt-4.1-nano",
        input_tokens=1_000_000,
        cached_input_tokens=0,
        output_tokens=1_000_000,
    )
    assert cost == round(0.10 + 0.40, 6)


def test_cost_gpt_4_1_mini_with_cached_split() -> None:
    cost = calculate_cost_usd(
        model="gpt-4.1-mini",
        input_tokens=2000,
        cached_input_tokens=1000,
        output_tokens=500,
    )
    expected = (1000 * 0.40 + 1000 * 0.10 + 500 * 1.60) / 1_000_000
    assert cost == round(expected, 6)


def test_cost_gpt_4_1_pricing_table() -> None:
    cost = calculate_cost_usd(
        model="gpt-4.1",
        input_tokens=1_000_000,
        output_tokens=1_000_000,
    )
    assert cost == round(2.00 + 8.00, 6)


def test_cost_unknown_model_returns_zero() -> None:
    assert calculate_cost_usd(
        model="ghost-model",
        input_tokens=1000,
        output_tokens=1000,
    ) == 0.0


def test_cost_clamps_negative_inputs() -> None:
    assert calculate_cost_usd(
        model="gpt-4.1-nano",
        input_tokens=-100,
        cached_input_tokens=-50,
        output_tokens=-200,
    ) == 0.0


def test_cost_clamps_cached_exceeding_input() -> None:
    """cached_input_tokens > input_tokens 인 비정상 응답에서도 input 한도 넘지 않음."""
    cost = calculate_cost_usd(
        model="gpt-4.1-nano",
        input_tokens=1000,
        cached_input_tokens=1500,
        output_tokens=0,
    )
    expected = 1000 * 0.025 / 1_000_000  # cached 가 1000 으로 clamp
    assert cost == round(expected, 6)


# ---------- hashing ----------


def test_sha256_deterministic_with_key_order() -> None:
    a = sha256_of({"q": "x", "n": 1})
    b = sha256_of({"n": 1, "q": "x"})
    assert a == b
    assert a.startswith("sha256:")
    assert len(a) == len("sha256:") + 64


def test_sha256_differs_for_different_payload() -> None:
    assert sha256_of({"q": "x"}) != sha256_of({"q": "y"})


def test_sha256_handles_korean_unicode() -> None:
    a = sha256_of({"q": "이번 주 전환율"})
    b = sha256_of({"q": "이번 주 전환율"})
    assert a == b


# ---------- redaction ----------


def test_redact_data_source_masks_sample_values_with_count() -> None:
    ds = {
        "columns": [
            {"column_name": "channel", "sample_values": ["a", "b", "c"]},
            {"column_name": "ts", "sample_values": []},
        ]
    }
    redacted = redact_data_source(ds)
    assert redacted["columns"][0]["sample_values"] == "<redacted: 3 items>"
    assert redacted["columns"][1]["sample_values"] == "<redacted: 0 items>"
    assert redacted["columns"][0]["column_name"] == "channel"
    assert ds["columns"][0]["sample_values"] == ["a", "b", "c"]  # 원본 불변


def test_redact_data_source_no_columns_returns_same_shape() -> None:
    ds = {"file_name": "x.csv"}
    assert redact_data_source(ds) == ds


def test_redact_chart_data_masks_rows_with_count() -> None:
    cd = {"columns": ["a", "b"], "rows": [[1, 2], [3, 4], [5, 6]]}
    redacted = redact_chart_data(cd)
    assert redacted["rows"] == "<redacted: 3 rows>"
    assert redacted["columns"] == ["a", "b"]


def test_redact_chart_data_empty_rows() -> None:
    cd = {"columns": ["a"], "rows": []}
    assert redact_chart_data(cd)["rows"] == "<redacted: 0 rows>"


# ---------- emit_event / LLMEventBuilder ----------


def test_emit_event_writes_json_to_stdout(
    capsys: pytest.CaptureFixture[str],
) -> None:
    emit_event({"event_type": "llm_call", "request_id": "req_1"})

    events = _captured_events(capsys.readouterr().out)
    assert events == [{"event_type": "llm_call", "request_id": "req_1"}]


def test_emit_event_korean_chars_not_escaped(
    capsys: pytest.CaptureFixture[str],
) -> None:
    emit_event({"reason": "한글 보존"})

    out = capsys.readouterr().out
    assert "한글" in out
    parsed = json.loads(out.strip())
    assert parsed["reason"] == "한글 보존"


def test_event_builder_emits_single_event_with_all_fields(
    capsys: pytest.CaptureFixture[str],
) -> None:
    (
        LLMEventBuilder(api_name="question_analysis", request_id="req_X")
        .with_prompt_version("question_analysis_v1")
        .with_schema_version("question_analysis_response_v1")
        .with_llm_call(model="gpt-4.1-mini", temperature=0.0, max_output_tokens=1200)
        .with_usage(
            input_tokens=2000, cached_input_tokens=500,
            output_tokens=600, total_tokens=2600,
        )
        .with_cost(0.00202)
        .with_performance(latency_ms=1830, retry_count=0)
        .with_validation(
            schema_validation_status="passed",
            business_validation_status="passed",
        )
        .with_warnings(["CRITICAL_NULL_DETECTED"])
        .with_hashes(input_hash="sha256:abc", output_hash="sha256:def")
        .emit()
    )

    events = _captured_events(capsys.readouterr().out)
    assert len(events) == 1
    event = events[0]

    assert event["event_type"] == "llm_call"
    assert event["api_name"] == "question_analysis"
    assert event["request_id"] == "req_X"
    assert event["prompt_version"] == "question_analysis_v1"
    assert event["schema_version"] == "question_analysis_response_v1"
    assert event["llm"]["model"] == "gpt-4.1-mini"
    assert event["usage"]["cached_input_tokens"] == 500
    assert event["cost"]["estimated_cost_usd"] == 0.00202
    assert event["performance"]["latency_ms"] == 1830
    assert event["validation"]["schema_validation_status"] == "passed"
    assert event["warnings"]["warning_codes"] == ["CRITICAL_NULL_DETECTED"]
    assert event["error"] == {"error_code": None, "error_message": None}
    assert event["hashes"]["input_hash"] == "sha256:abc"
    assert "timestamp" in event


def test_event_builder_error_defaults_to_null_when_not_set(
    capsys: pytest.CaptureFixture[str],
) -> None:
    LLMEventBuilder(api_name="result_summary", request_id="req_Y").emit()

    event = _captured_events(capsys.readouterr().out)[0]
    assert event["error"] == {"error_code": None, "error_message": None}


def test_event_builder_explicit_error_overrides_default(
    capsys: pytest.CaptureFixture[str],
) -> None:
    (
        LLMEventBuilder(api_name="question_analysis", request_id="req_Z")
        .with_error(error_code="LLM_CALL_FAILED", error_message="timeout")
        .emit()
    )

    event = _captured_events(capsys.readouterr().out)[0]
    assert event["error"]["error_code"] == "LLM_CALL_FAILED"
    assert event["error"]["error_message"] == "timeout"


def test_event_builder_emit_is_idempotent(
    capsys: pytest.CaptureFixture[str],
) -> None:
    """두 번째 emit() 호출은 no-op (중복 CloudWatch 기록 방지)."""
    builder = LLMEventBuilder(api_name="x", request_id="req_1")
    builder.emit()
    builder.emit()

    events = _captured_events(capsys.readouterr().out)
    assert len(events) == 1


def test_event_builder_method_chaining_returns_self() -> None:
    builder = LLMEventBuilder(api_name="x", request_id="y")
    assert builder.with_prompt_version("v1") is builder
    assert builder.with_schema_version("s1") is builder
    assert builder.with_llm_call(
        model="m", temperature=0.0, max_output_tokens=100,
    ) is builder
    assert builder.with_usage(
        input_tokens=1, output_tokens=1, total_tokens=2,
    ) is builder
    assert builder.with_cost(0.001) is builder
    assert builder.with_performance(latency_ms=10) is builder
    assert builder.with_validation(
        schema_validation_status="passed",
        business_validation_status="passed",
    ) is builder
    assert builder.with_warnings([]) is builder
    assert builder.with_error(error_code=None, error_message=None) is builder
    assert builder.with_hashes(input_hash="sha256:x") is builder
