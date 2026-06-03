"""eval/scoring.py 의 result_summary dual-track 채점 (`_score_result_summary_case`) 단위 테스트.

score_case(suite="result_summary", ...) 경로를 통해:
  - hard: plain_text 키워드 포함 + segments↔plain_text 무결성
  - soft: emphasis_pattern (segment 별 강조 위치) + emphasis_keywords (강조 텍스트 포함)
의 채점 동작을 통과/실패 두 케이스로 검증한다.
"""

from __future__ import annotations

from eval.scoring import score_case


def _actual(segments: list[dict], plain_text: str) -> dict:
    """result_summary 응답 dict (description.segments / description.plain_text) 를 만든다."""
    return {
        "request_id": "rs-test",
        "description": {
            "segments": segments,
            "plain_text": plain_text,
        },
    }


def _passing_actual() -> dict:
    return _actual(
        segments=[
            {"text": "paid_search·mobile에서 가입 전환율이 ", "emphasis": False},
            {"text": "5%p 하락", "emphasis": True},
            {"text": "했어요.", "emphasis": False},
        ],
        plain_text="paid_search·mobile에서 가입 전환율이 5%p 하락했어요.",
    )


_EXPECTED = {
    "hard": {"plain_text_contains": ["paid_search", "mobile", "5%p", "하락"]},
    "soft": {
        "emphasis_pattern": [False, True, False],
        "emphasis_keywords": ["5%p 하락"],
    },
}


# ────────────────────────────────────────────────────────────────
# 통과 케이스 (모든 hard/soft 항목 충족)
# ────────────────────────────────────────────────────────────────

def test_score_result_summary_passing_case() -> None:
    score = score_case(
        case_id="RS-01", suite="result_summary",
        expected=_EXPECTED, actual=_passing_actual(),
        error=None, latency_ms=42,
    )
    assert score.passed is True
    assert score.hard_fail is False
    paths = {c.path for c in score.field_comparisons}
    # hard: 키워드 4개 + 무결성, soft: 패턴 + 키워드 1개
    assert "hard.plain_text_contains[paid_search]" in paths
    assert "hard.plain_text_integrity" in paths
    assert "soft.emphasis_pattern" in paths
    assert "soft.emphasis_keywords[5%p 하락]" in paths
    assert all(c.match for c in score.field_comparisons)


# ────────────────────────────────────────────────────────────────
# 실패 케이스 (hard 키워드 누락 시 hard_fail)
# ────────────────────────────────────────────────────────────────

def test_score_result_summary_hard_keyword_missing_marks_hard_fail() -> None:
    actual = _actual(
        segments=[
            {"text": "organic에서 가입 전환율이 ", "emphasis": False},
            {"text": "5%p 하락", "emphasis": True},
            {"text": "했어요.", "emphasis": False},
        ],
        plain_text="organic에서 가입 전환율이 5%p 하락했어요.",
    )
    score = score_case(
        case_id="RS-01", suite="result_summary",
        expected=_EXPECTED, actual=actual,
        error=None, latency_ms=42,
    )
    assert score.passed is False
    assert score.hard_fail is True
    failed = {c.path for c in score.field_comparisons if not c.match}
    # "paid_search" / "mobile" 키워드 미포함
    assert "hard.plain_text_contains[paid_search]" in failed
    assert "hard.plain_text_contains[mobile]" in failed


# ────────────────────────────────────────────────────────────────
# segments↔plain_text 무결성 위반 → hard_fail
# ────────────────────────────────────────────────────────────────

def test_score_result_summary_integrity_violation_marks_hard_fail() -> None:
    actual = _actual(
        segments=[
            {"text": "paid_search·mobile에서 가입 전환율이 ", "emphasis": False},
            {"text": "5%p 하락", "emphasis": True},
            {"text": "했어요.", "emphasis": False},
        ],
        # join 결과와 다른 plain_text (무결성 위반)
        plain_text="paid_search·mobile에서 가입 전환율이 10%p 하락했어요.",
    )
    score = score_case(
        case_id="RS-01", suite="result_summary",
        expected=_EXPECTED, actual=actual,
        error=None, latency_ms=42,
    )
    assert score.passed is False
    assert score.hard_fail is True
    integrity = next(c for c in score.field_comparisons if c.path == "hard.plain_text_integrity")
    assert integrity.match is False


# ────────────────────────────────────────────────────────────────
# soft 항목만 어긋남 → passed=False 이지만 hard_fail=False
# ────────────────────────────────────────────────────────────────

def test_score_result_summary_soft_only_mismatch_is_not_hard_fail() -> None:
    actual = _actual(
        segments=[
            # 강조 위치가 기대 패턴([F,T,F])과 다름: 첫 segment 를 강조
            {"text": "paid_search·mobile에서 가입 전환율이 ", "emphasis": True},
            {"text": "5%p 하락", "emphasis": False},
            {"text": "했어요.", "emphasis": False},
        ],
        plain_text="paid_search·mobile에서 가입 전환율이 5%p 하락했어요.",
    )
    score = score_case(
        case_id="RS-01", suite="result_summary",
        expected=_EXPECTED, actual=actual,
        error=None, latency_ms=42,
    )
    assert score.passed is False
    assert score.hard_fail is False
    pattern = next(c for c in score.field_comparisons if c.path == "soft.emphasis_pattern")
    assert pattern.match is False
    # 강조 텍스트가 "5%p 하락" 을 포함하지 않으므로 emphasis_keywords 도 실패
    kw = next(c for c in score.field_comparisons if c.path == "soft.emphasis_keywords[5%p 하락]")
    assert kw.match is False
