"""eval/ 단위 테스트 — loader · runner · scoring · CLI 통합."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from eval import (
    CaseScore,
    apply_dataset_overrides,
    load_cases,
    load_fixture,
    score_case,
    summarize_suite,
)
from eval.loader import CASES_DIR, FIXTURES_DIR
from eval.runner import run_case


# ---------- loader: fixture / case ----------


def test_load_fixture_returns_parsed_dict(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    fixture = {"id": "dataset-x", "fields": [{"name": "a"}]}
    fixture_file = tmp_path / "dataset-x.json"
    fixture_file.write_text(json.dumps(fixture), encoding="utf-8")
    monkeypatch.setattr("eval.loader.FIXTURES_DIR", tmp_path)

    assert load_fixture("dataset-x") == fixture


def test_load_fixture_missing_raises() -> None:
    with pytest.raises(FileNotFoundError):
        load_fixture("ghost-dataset")


def test_load_cases_returns_sorted_by_filename(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    suite_dir = tmp_path / "question_analysis" / "cmp"
    suite_dir.mkdir(parents=True)
    (suite_dir / "CMP-02.json").write_text('{"id": "CMP-02"}', encoding="utf-8")
    (suite_dir / "CMP-01.json").write_text('{"id": "CMP-01"}', encoding="utf-8")
    monkeypatch.setattr("eval.loader.CASES_DIR", tmp_path)

    cases = load_cases("question_analysis", "cmp")

    assert [c["id"] for c in cases] == ["CMP-01", "CMP-02"]


def test_load_cases_unknown_suite_returns_empty(monkeypatch: pytest.MonkeyPatch) -> None:
    assert load_cases("ghost_suite") == []


# ---------- loader: dataset overrides ----------


def test_apply_dataset_overrides_modifies_field() -> None:
    dataset = {"fields": [{"name": "x", "null_ratio": 0.0}]}
    result = apply_dataset_overrides(
        dataset, override_columns={"x": {"null_ratio": 0.42}},
    )
    assert result["fields"][0]["null_ratio"] == 0.42
    assert dataset["fields"][0]["null_ratio"] == 0.0  # 원본 불변


def test_apply_dataset_overrides_removes_column() -> None:
    dataset = {"fields": [{"name": "x"}, {"name": "y"}]}
    result = apply_dataset_overrides(
        dataset, override_columns={"x": {"remove": True}},
    )
    assert [c["name"] for c in result["fields"]] == ["y"]


def test_apply_dataset_overrides_adds_columns() -> None:
    dataset = {"fields": [{"name": "x"}]}
    result = apply_dataset_overrides(
        dataset, add_columns=[{"name": "y"}, {"name": "z"}],
    )
    assert [c["name"] for c in result["fields"]] == ["x", "y", "z"]


def test_apply_dataset_overrides_uses_columns_key_when_present() -> None:
    dataset = {"columns": [{"column_name": "x"}]}
    result = apply_dataset_overrides(
        dataset, add_columns=[{"column_name": "y"}],
    )
    assert [c["column_name"] for c in result["columns"]] == ["x", "y"]


# ---------- scoring ----------


def test_score_case_all_fields_match_passes() -> None:
    score = score_case(
        case_id="C1", suite="question_analysis",
        expected={"analysis_criteria": {"analysis_type": "COMPARISON", "metric_name": "cr"}},
        actual={"analysis_criteria": {"analysis_type": "COMPARISON", "metric_name": "cr"}},
        error=None, latency_ms=100,
    )
    assert score.passed is True
    assert score.hard_fail is False


def test_score_case_hard_fail_on_analysis_type_mismatch() -> None:
    score = score_case(
        case_id="C1", suite="question_analysis",
        expected={"analysis_criteria": {"analysis_type": "COMPARISON", "metric_name": "cr"}},
        actual={"analysis_criteria": {"analysis_type": "RANKING", "metric_name": "cr"}},
        error=None, latency_ms=100,
    )
    assert score.passed is False
    assert score.hard_fail is True


def test_score_case_non_hard_fail_field_mismatch_fails_but_not_hard() -> None:
    score = score_case(
        case_id="C1", suite="question_analysis",
        expected={
            "analysis_criteria": {
                "analysis_type": "COMPARISON", "metric_name": "cr",
                "base_date_column": "signed_at", "sort_direction": "asc",
            }
        },
        actual={
            "analysis_criteria": {
                "analysis_type": "COMPARISON", "metric_name": "cr",
                "base_date_column": "signed_at", "sort_direction": "desc",
            }
        },
        error=None, latency_ms=100,
    )
    assert score.passed is False
    assert score.hard_fail is False  # sort_direction 은 hard-fail 아님


def test_score_case_hard_fail_on_compare_period_mismatch_for_comparison() -> None:
    score = score_case(
        case_id="CMP-X", suite="question_analysis",
        expected={"analysis_criteria": {"analysis_type": "COMPARISON", "compare_period": "1W"}},
        actual={"analysis_criteria": {"analysis_type": "COMPARISON", "compare_period": "1M"}},
        error=None, latency_ms=100,
    )
    assert score.passed is False
    assert score.hard_fail is True  # COMPARISON 의 compare_period 는 hard-fail


def test_score_case_compare_period_mismatch_not_hard_for_ranking() -> None:
    score = score_case(
        case_id="RNK-X", suite="question_analysis",
        expected={"analysis_criteria": {"analysis_type": "RANKING", "compare_period": None}},
        actual={"analysis_criteria": {"analysis_type": "RANKING", "compare_period": "1W"}},
        error=None, latency_ms=100,
    )
    assert score.passed is False
    assert score.hard_fail is False  # RANKING 에서는 compare_period 가 hard-fail 아님


def test_score_case_compare_period_match_for_comparison_passes() -> None:
    score = score_case(
        case_id="CMP-Y", suite="question_analysis",
        expected={"analysis_criteria": {"analysis_type": "COMPARISON", "compare_period": "1W"}},
        actual={"analysis_criteria": {"analysis_type": "COMPARISON", "compare_period": "1W"}},
        error=None, latency_ms=100,
    )
    assert score.passed is True
    assert score.hard_fail is False


def test_score_case_compare_period_mismatch_without_analysis_type_not_hard() -> None:
    # analysis_type 부재 시 COMPARISON 확신 불가 -> compare_period 를 hard-fail 로 안 본다(방어적 기본값).
    score = score_case(
        case_id="EDGE-1", suite="question_analysis",
        expected={"analysis_criteria": {"compare_period": "1W", "metric_name": "cr"}},
        actual={"analysis_criteria": {"compare_period": "1M", "metric_name": "cr"}},
        error=None, latency_ms=100,
    )
    assert score.passed is False
    assert score.hard_fail is False


def test_score_case_error_marks_hard_fail() -> None:
    score = score_case(
        case_id="C1", suite="question_analysis",
        expected={}, actual=None, error="TimeoutError: upstream", latency_ms=30000,
    )
    assert score.passed is False
    assert score.hard_fail is True
    assert "TimeoutError" in (score.error or "")


def test_score_case_list_compared_as_set() -> None:
    score = score_case(
        case_id="C1", suite="question_analysis",
        expected={"analysis_criteria": {"group_by": ["channel", "device"]}},
        actual={"analysis_criteria": {"group_by": ["device", "channel"]}},
        error=None, latency_ms=100,
    )
    # group_by 는 hard-fail 아니고 expected vs actual list 가 set 비교
    matches = {c.path: c.match for c in score.field_comparisons}
    assert matches.get("analysis_criteria.group_by") is True


def test_score_file_analysis_normalizes_column_roles_list_to_dict() -> None:
    """file_analysis 응답의 column_roles 가 list 인데 expected 가 dict 형식일 때 비교 가능."""
    score = score_case(
        case_id="FA-X", suite="file_analysis",
        expected={"column_roles": {"event_date": "DATE_CRITERIA", "channel": "DIMENSION"}},
        actual={
            "column_roles": [
                {"column_name": "event_date", "semantic_role": "DATE_CRITERIA",
                 "confidence": 0.8, "display_name": "event_date"},
                {"column_name": "channel", "semantic_role": "DIMENSION",
                 "confidence": 0.8, "display_name": "channel"},
            ]
        },
        error=None, latency_ms=100,
    )
    assert score.passed is True


def test_score_question_analysis_normalizes_warnings_list_to_dict() -> None:
    """question_analysis 의 warnings list 도 code key 기반 dict 로 정규화."""
    score = score_case(
        case_id="WRN-X", suite="question_analysis",
        expected={"warnings": {"CRITICAL_NULL_DETECTED": True}},
        actual={
            "warnings": [
                {"code": "CRITICAL_NULL_DETECTED", "related_fields": ["x"], "detail": "..."},
            ],
        },
        error=None, latency_ms=100,
    )
    assert score.passed is True


def test_score_file_analysis_normalizes_warnings_list_to_dict() -> None:
    """warnings list 도 code key 기반 dict 로 정규화."""
    score = score_case(
        case_id="FA-X", suite="file_analysis",
        expected={"warnings": {"DATE_FIELD_CONFLICT": True}},
        actual={
            "column_roles": [],
            "warnings": [{"code": "DATE_FIELD_CONFLICT", "related_columns": ["a", "b"]}],
        },
        error=None, latency_ms=100,
    )
    assert score.passed is True


def test_summarize_suite_computes_rates() -> None:
    scores = [
        CaseScore(case_id="C1", suite="q", passed=True, hard_fail=False,
                  field_comparisons=[], error=None, latency_ms=100),
        CaseScore(case_id="C2", suite="q", passed=False, hard_fail=True,
                  field_comparisons=[], error=None, latency_ms=200),
        CaseScore(case_id="C3", suite="q", passed=True, hard_fail=False,
                  field_comparisons=[], error=None, latency_ms=300),
    ]
    report = summarize_suite("q", scores)
    assert report.total == 3
    assert report.passed == 2
    assert report.failed == 1
    assert report.hard_fail_count == 1
    assert report.exact_match_rate == 2 / 3


# ---------- runner (mock 모드 smoke) ----------


def test_runner_question_analysis_mock_path(monkeypatch: pytest.MonkeyPatch) -> None:
    """ANAL_LLM_MOCK=true 로 mock 응답을 받아 RunResult 반환되는지."""
    monkeypatch.setenv("ANAL_LLM_MOCK", "true")
    case = {
        "id": "smoke-1",
        "input": {
            "request_id": "req_smoke",
            "conversation_id": 1,
            "question": {"content": "?"},
            "data_source": {
                "id": 1,
                "columns": [
                    {
                        "column_name": "signed_at", "data_type": "datetime",
                        "semantic_role": "DATE_CRITERIA",
                        "null_ratio": 0.0, "sample_values": [],
                    },
                    {
                        "column_name": "channel", "data_type": "string",
                        "semantic_role": "DIMENSION",
                        "null_ratio": 0.0, "sample_values": [],
                    },
                ],
            },
            "catalog": {
                "analysis_types": ["COMPARISON", "RANKING"],
                "metric_types": ["RATIO"],
                "predefined_metrics": [{
                    "metric_name": "cr", "display_name": "전환율", "metric_type": "RATIO",
                    "formula_numerator": "a", "formula_denominator": "b",
                }],
                "supported_periods": ["this_week", "last_week"],
                "flow_warning_keys": [{
                    "code": "QUESTION_DATA_MISMATCH", "name": "x", "comment": "y",
                }],
            },
        },
    }

    result = run_case("question_analysis", case)

    assert result.case_id == "smoke-1"
    assert result.error is None
    assert result.response is not None
    assert result.response["request_id"] == "req_smoke"


def test_composer_question_analysis_builds_valid_request() -> None:
    """spec → composer → Pydantic 검증 통과."""
    from eval.composers import compose_question_analysis_request
    from schemas.api.question_analysis import QuestionAnalysisRequest

    payload = compose_question_analysis_request({
        "id": "CMP-X",
        "dataset": "dataset-a",
        "question": "이번 주 가입 전환율 top 5",
    })
    req = QuestionAnalysisRequest.model_validate(payload)
    assert req.request_id == "cmp_x"
    assert any(c.column_name == "event_date" for c in req.data_source.columns)
    assert {m.metric_name for m in req.catalog.predefined_metrics} == {
        "signup_conversion_rate", "activation_rate", "trial_start_rate", "paid_conversion_rate",
    }


def test_composer_applies_override_columns_remove() -> None:
    from eval.composers import compose_question_analysis_request

    payload = compose_question_analysis_request({
        "id": "UNS-X",
        "dataset": "dataset-a",
        "override_columns": {"signup_complete": {"remove": True}},
        "question": "이번 주 채널별 가입 전환율 top 5",
    })
    column_names = [c["column_name"] for c in payload["data_source"]["columns"]]
    assert "signup_complete" not in column_names


def test_composer_applies_add_columns() -> None:
    from eval.composers import compose_question_analysis_request

    payload = compose_question_analysis_request({
        "id": "AMB-X",
        "dataset": "dataset-a",
        "add_columns": [
            {"name": "new_col", "data_type": "string", "role": "DIMENSION"},
        ],
        "question": "x",
    })
    column_names = [c["column_name"] for c in payload["data_source"]["columns"]]
    assert "new_col" in column_names


def test_all_question_analysis_case_files_load_and_compose() -> None:
    """43개 02 케이스가 모두 Pydantic 검증을 통과하는지 (단순 로드 + composer + validate)."""
    from eval.composers import compose_question_analysis_request
    from schemas.api.question_analysis import QuestionAnalysisRequest

    expected_count = {"cmp": 10, "rnk": 10, "flt": 3, "wrn": 3, "uns": 8, "amb": 9}
    for category, count in expected_count.items():
        cases = load_cases("question_analysis", category)
        assert len(cases) == count, f"{category} count mismatch: got {len(cases)}, expected {count}"
        for case in cases:
            payload = compose_question_analysis_request(case["spec"])
            QuestionAnalysisRequest.model_validate(payload)


def test_all_file_analysis_case_files_load_and_validate() -> None:
    """기존 14개 01 케이스가 Pydantic 검증 통과 (regression guard)."""
    from schemas.api.file_analysis import FileAnalysisRequest

    cases = load_cases("file_analysis")
    assert len(cases) == 14
    for case in cases:
        FileAnalysisRequest.model_validate(case["input"])


def test_runner_unknown_suite_returns_error() -> None:
    result = run_case("ghost_suite", {"id": "C1", "input": {}})  # type: ignore[arg-type]
    assert result.error is not None
    assert "ghost_suite" in result.error or "알 수 없는" in result.error
