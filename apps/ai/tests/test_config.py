"""config/ 단위 테스트.

settings 헬퍼 — env 분기.
model_config — 미팅노트 2️⃣ 표 일치 + lookup 오류 처리.
"""

from __future__ import annotations

import pytest

from config import model_config, settings


# ---------- settings ----------


def test_openai_api_key_reads_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    assert settings.openai_api_key() == "test-key"


def test_openai_api_key_returns_none_when_unset(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    assert settings.openai_api_key() is None


def test_openai_timeout_sec_uses_default_when_unset(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("OPENAI_TIMEOUT_SEC", raising=False)
    assert settings.openai_timeout_sec() == 30.0


def test_openai_timeout_sec_uses_custom_default(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("OPENAI_TIMEOUT_SEC", raising=False)
    assert settings.openai_timeout_sec(default=10.0) == 10.0


def test_openai_timeout_sec_parses_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_TIMEOUT_SEC", "5.5")
    assert settings.openai_timeout_sec() == 5.5


def test_is_mock_mode_true_when_env_set(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ANAL_LLM_MOCK", "true")
    assert settings.is_mock_mode() is True


def test_is_mock_mode_case_insensitive(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ANAL_LLM_MOCK", "TRUE")
    assert settings.is_mock_mode() is True


def test_is_mock_mode_false_when_other_value(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ANAL_LLM_MOCK", "1")
    assert settings.is_mock_mode() is False


def test_is_mock_mode_false_when_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ANAL_LLM_MOCK", raising=False)
    assert settings.is_mock_mode() is False


# ---------- model_config ----------


def test_model_config_for_question_analysis_matches_meeting_note() -> None:
    cfg = model_config.model_config_for("question_analysis")
    assert cfg.model == "gpt-4.1-mini"
    assert cfg.temperature == 0.0
    assert cfg.max_output_tokens == 1200


def test_model_config_for_result_summary_matches_meeting_note() -> None:
    cfg = model_config.model_config_for("result_summary")
    assert cfg.model == "gpt-4.1-nano"
    assert cfg.temperature == 0.1
    assert cfg.max_output_tokens == 300


def test_model_config_for_file_analysis_matches_meeting_note() -> None:
    cfg = model_config.model_config_for("file_analysis")
    assert cfg.model == "gpt-4.1-nano"
    assert cfg.temperature == 0.0
    assert cfg.max_output_tokens == 1600


def test_model_config_for_unknown_api_raises_keyerror() -> None:
    with pytest.raises(KeyError, match="허용"):
        model_config.model_config_for("ghost_api")  # type: ignore[arg-type]


def test_as_llm_kwargs_shape() -> None:
    cfg = model_config.model_config_for("question_analysis")
    assert cfg.as_llm_kwargs() == {
        "model": "gpt-4.1-mini",
        "temperature": 0.0,
        "max_output_tokens": 1200,
    }


def test_model_config_is_frozen() -> None:
    cfg = model_config.model_config_for("question_analysis")
    with pytest.raises(Exception):  # FrozenInstanceError (dataclass)
        cfg.model = "other"  # type: ignore[misc]
