"""평가 점수 산정 — case 별 field 비교 + suite 별 hard-fail 분기 + 합산 지표.

ai_test_cast_plan §7 평가 기준표 기준:
- hard-fail 필드 (오답 시 case 전체 FAIL): analysis_type · metric_name · base_date_column · COMPARISON 의 compare_period
- 일반 필드 (점수 합산에만 영향): group_by · sort_by · sort_direction · limit_num · filters · warnings

본 모듈은 question_analysis 의 평가 규칙을 우선 구현. file_analysis · result_summary 는
suite 별 hard-fail 셋만 교체하면 동일 골격 재사용.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


# suite 별 hard-fail 필드 (응답 dict 경로, dot-notation)
_HARD_FAIL_FIELDS: dict[str, list[str]] = {
    "question_analysis": [
        "analysis_criteria.analysis_type",
        "analysis_criteria.metric_name",
        "analysis_criteria.base_date_column",
        # compare_period 는 COMPARISON 분석에서만 hard-fail (아래 _is_hard_fail 참고).
        "analysis_criteria.compare_period",
    ],
    "file_analysis": [
        # 01 FA 케이스는 column_roles 가 핵심. expected.column_roles 가 dict 형태라 별도 처리.
    ],
    "result_summary": [
        # 03 케이스는 segments↔plain_text 정합이 셀프 검증으로 이미 강제됨.
        "description.plain_text",
    ],
}


@dataclass
class FieldComparison:
    path: str
    expected: Any
    actual: Any
    match: bool


@dataclass
class CaseScore:
    case_id: str
    suite: str
    passed: bool
    hard_fail: bool
    field_comparisons: list[FieldComparison]
    error: str | None
    latency_ms: int


@dataclass
class SuiteReport:
    suite: str
    total: int
    passed: int
    failed: int
    hard_fail_count: int
    exact_match_rate: float
    field_accuracy: dict[str, float]
    cases: list[CaseScore] = field(default_factory=list)


def score_case(
    *,
    case_id: str,
    suite: str,
    expected: dict[str, Any],
    actual: dict[str, Any] | None,
    error: str | None,
    latency_ms: int,
    error_code: str | None = None,
    accept_error_codes: list[str] | None = None,
) -> CaseScore:
    """case 의 expected vs actual 을 비교해 CaseScore 반환.

    actual=None (error 발생) 인 경우 hard-fail FAIL.
    단, accept_error_codes 에 error_code 가 포함된 경우 PASS 로 처리 (듀얼-브랜치 수용).
    """
    if error is not None or actual is None:
        # accept_error_codes 에 해당하는 에러 코드면 PASS 로 허용 (LLM_REFERENCE_VIOLATION 등 듀얼-브랜치)
        if error_code is not None and accept_error_codes and error_code in accept_error_codes:
            return CaseScore(
                case_id=case_id,
                suite=suite,
                passed=True,
                hard_fail=False,
                field_comparisons=[],
                error=error,
                latency_ms=latency_ms,
            )
        return CaseScore(
            case_id=case_id,
            suite=suite,
            passed=False,
            hard_fail=True,
            field_comparisons=[],
            error=error or "actual response is None",
            latency_ms=latency_ms,
        )

    actual = _normalize_actual(suite, actual)

    comparisons: list[FieldComparison] = []
    for path, expected_value in _flatten_expected(expected):
        actual_value = _get_path(actual, path)
        comparisons.append(FieldComparison(
            path=path,
            expected=expected_value,
            actual=actual_value,
            match=_field_match(expected_value, actual_value),
        ))

    passed = all(c.match for c in comparisons)
    hard_fail = _is_hard_fail(suite, comparisons)

    return CaseScore(
        case_id=case_id,
        suite=suite,
        passed=passed,
        hard_fail=hard_fail,
        field_comparisons=comparisons,
        error=None,
        latency_ms=latency_ms,
    )


def summarize_suite(suite: str, scores: list[CaseScore]) -> SuiteReport:
    """case 점수 리스트를 suite 합산 리포트로 변환."""
    total = len(scores)
    passed = sum(1 for s in scores if s.passed)
    failed = total - passed
    hard_fail_count = sum(1 for s in scores if s.hard_fail)
    exact_match_rate = passed / total if total else 0.0

    # field 별 정확도 (어떤 case 에서든 등장한 모든 path 기준)
    path_pass_count: dict[str, int] = {}
    path_total_count: dict[str, int] = {}
    for score in scores:
        for cmp in score.field_comparisons:
            path_total_count[cmp.path] = path_total_count.get(cmp.path, 0) + 1
            if cmp.match:
                path_pass_count[cmp.path] = path_pass_count.get(cmp.path, 0) + 1
    field_accuracy = {
        path: path_pass_count.get(path, 0) / total_count
        for path, total_count in path_total_count.items()
    }

    return SuiteReport(
        suite=suite,
        total=total,
        passed=passed,
        failed=failed,
        hard_fail_count=hard_fail_count,
        exact_match_rate=exact_match_rate,
        field_accuracy=field_accuracy,
        cases=scores,
    )


# ---------- internals ----------


def _normalize_actual(suite: str, actual: dict[str, Any]) -> dict[str, Any]:
    """suite 별 응답 형태 정규화 — list of dicts 를 dot-notation 비교 가능한 dict 로 변환.

    file_analysis: `column_roles[{column_name, semantic_role, ...}]` → `{column_name: semantic_role}`,
    `warnings[{code, ...}]` → `{code1: True}`.
    question_analysis: `warnings[{code, ...}]` → `{code1: True}` (셋 비교용).
    """
    normalized = {**actual}

    if suite == "file_analysis" and isinstance(actual.get("column_roles"), list):
        normalized["column_roles"] = {
            cr["column_name"]: cr["semantic_role"]
            for cr in actual["column_roles"]
            if "column_name" in cr and "semantic_role" in cr
        }

    if suite in ("file_analysis", "question_analysis") and isinstance(actual.get("warnings"), list):
        normalized["warnings"] = {
            w["code"]: True
            for w in actual["warnings"]
            if "code" in w
        }

    return normalized


def _flatten_expected(d: Any, prefix: str = "") -> list[tuple[str, Any]]:
    """expected dict 를 dot-notation path 리스트로 평탄화. list 는 통째 비교."""
    out: list[tuple[str, Any]] = []
    if isinstance(d, dict):
        for k, v in d.items():
            sub_prefix = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                out.extend(_flatten_expected(v, sub_prefix))
            else:
                out.append((sub_prefix, v))
    else:
        out.append((prefix, d))
    return out


def _get_path(d: dict[str, Any], path: str) -> Any:
    """dot-notation path 로 dict 에서 값 추출. 없으면 None."""
    current: Any = d
    for key in path.split("."):
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current


def _field_match(expected: Any, actual: Any) -> bool:
    """field 비교 — list 는 set 비교(순서 무관, hashable 요소만)·dict 는 entry-wise."""
    if isinstance(expected, list) and isinstance(actual, list):
        try:
            return set(expected) == set(actual)
        except TypeError:
            return expected == actual
    return expected == actual


_COMPARE_PERIOD_PATH = "analysis_criteria.compare_period"


def _is_hard_fail(suite: str, comparisons: list[FieldComparison]) -> bool:
    hard_paths = set(_HARD_FAIL_FIELDS.get(suite, []))
    if not hard_paths:
        return False
    # compare_period 는 COMPARISON 분석에서만 hard-fail 이다. expected 의 analysis_type 이
    # COMPARISON 이 아니면 hard 셋에서 제외한다 (RANKING expected 에 compare_period 비교가
    # 생기더라도 오탐으로 케이스를 죽이지 않도록).
    if _COMPARE_PERIOD_PATH in hard_paths and not _expected_is_comparison(comparisons):
        hard_paths.discard(_COMPARE_PERIOD_PATH)
    failed_hard_paths = {c.path for c in comparisons if not c.match} & hard_paths
    return bool(failed_hard_paths)


def _expected_is_comparison(comparisons: list[FieldComparison]) -> bool:
    """expected 의 analysis_type 이 COMPARISON 인지 (없으면 False)."""
    for c in comparisons:
        if c.path == "analysis_criteria.analysis_type":
            return c.expected == "COMPARISON"
    return False
