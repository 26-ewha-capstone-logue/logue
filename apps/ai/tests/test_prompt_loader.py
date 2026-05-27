"""prompt_loader 단위 테스트.

실제 prompts/ 디렉토리의 v1 골격 파일 3종 로딩 + 미존재 분기 + LRU 캐시 동작 검증.
"""

from __future__ import annotations

import pytest

from llm import prompt_loader


@pytest.fixture(autouse=True)
def _clear_prompt_cache() -> None:
    prompt_loader.clear_cache()


# ---------- 정상 로딩 ----------


def test_load_system_prompt_returns_file_analysis_v1() -> None:
    content = prompt_loader.load_system_prompt("file_analysis")
    assert "# File Analysis" in content
    assert "Structured Outputs" in content


def test_load_system_prompt_returns_question_analysis_v1() -> None:
    content = prompt_loader.load_system_prompt("question_analysis")
    assert "# Question Analysis" in content
    assert "analysis_criteria" in content


def test_load_system_prompt_returns_result_summary_v1() -> None:
    content = prompt_loader.load_system_prompt("result_summary")
    assert "# Result Summary" in content
    assert "plain_text" in content


def test_load_system_prompt_default_version_is_v1() -> None:
    assert prompt_loader.load_system_prompt(
        "question_analysis"
    ) == prompt_loader.load_system_prompt("question_analysis", version="v1")


# ---------- 미존재 분기 ----------


def test_load_system_prompt_unknown_name_raises() -> None:
    with pytest.raises(FileNotFoundError, match="system prompt 파일이 없습니다"):
        prompt_loader.load_system_prompt("ghost_api")


def test_load_system_prompt_unknown_version_raises() -> None:
    with pytest.raises(FileNotFoundError, match="v999"):
        prompt_loader.load_system_prompt("question_analysis", version="v999")


# ---------- LRU 캐시 ----------


def test_load_system_prompt_returns_same_string_instance_on_cache_hit() -> None:
    first = prompt_loader.load_system_prompt("question_analysis")
    second = prompt_loader.load_system_prompt("question_analysis")
    assert first is second  # LRU 캐시 → identity 보존


def test_clear_cache_forces_disk_reread() -> None:
    first = prompt_loader.load_system_prompt("question_analysis")
    prompt_loader.clear_cache()
    second = prompt_loader.load_system_prompt("question_analysis")
    assert first == second  # 내용은 동일
    # identity 는 보장 안 됨 (cache_clear 후 새 read)


# ---------- prompt_version_id ----------


def test_prompt_version_id_default_v1() -> None:
    assert prompt_loader.prompt_version_id("question_analysis") == "question_analysis_v1"


def test_prompt_version_id_explicit_version() -> None:
    assert prompt_loader.prompt_version_id("file_analysis", version="v3") == "file_analysis_v3"


# ---------- 패키지 re-export ----------


def test_prompt_loader_exposed_via_llm_package() -> None:
    from llm import load_system_prompt, prompt_version_id

    assert callable(load_system_prompt)
    assert prompt_version_id("result_summary") == "result_summary_v1"
