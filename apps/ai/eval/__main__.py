"""CLI 엔트리 — `uv run python -m eval --suite <name> [--category <cat>] [--mock]`.

기본 mock 모드는 env `ANAL_LLM_MOCK` 을 따른다. `--mock` 플래그로 강제 활성화 가능.
결과는 콘솔 + `apps/ai/eval/results/<suite>_<timestamp>.jsonl` 로 저장.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import get_args

from eval.loader import load_cases
from eval.runner import RunResult, SuiteName, run_case
from eval.scoring import SuiteReport, score_case, summarize_suite


_KST = timezone(timedelta(hours=9))
_RESULTS_DIR = Path(__file__).resolve().parent / "results"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="eval", description="LLM 출력 품질 평가 하네스")
    parser.add_argument(
        "--suite", required=True, choices=list(get_args(SuiteName)),
        help="평가 대상 API",
    )
    parser.add_argument("--category", default=None, help="카테고리 필터 (예: cmp · rnk · flt)")
    parser.add_argument(
        "--mock", action="store_true",
        help="ANAL_LLM_MOCK=true 강제 활성화 (실제 OpenAI 호출 없이 smoke test 만)",
    )
    parser.add_argument(
        "--output", type=Path, default=None,
        help="결과 JSONL 저장 경로 (기본: apps/ai/eval/results/<suite>_<timestamp>.jsonl)",
    )
    args = parser.parse_args(argv)

    if args.mock:
        os.environ["ANAL_LLM_MOCK"] = "true"

    cases = load_cases(args.suite, args.category)
    if not cases:
        print(f"⚠ '{args.suite}' (category={args.category}) 에 케이스가 없습니다.")
        return 0

    print(f"▶ {args.suite} suite, {len(cases)} cases (mock={args.mock})")

    scores = []
    for case in cases:
        result: RunResult = run_case(args.suite, case)
        score = score_case(
            case_id=result.case_id,
            suite=args.suite,
            expected=case.get("expected", {}),
            actual=result.response,
            error=result.error,
            latency_ms=result.latency_ms,
            error_code=result.error_code,
            accept_error_codes=case.get("accept_error_codes"),
        )
        scores.append(score)
        status = "✅" if score.passed else ("🔥" if score.hard_fail else "❌")
        print(f"  {status} {score.case_id}  ({score.latency_ms}ms)")
        if score.error:
            print(f"      error: {score.error}")

    report = summarize_suite(args.suite, scores)
    _print_summary(report)

    output_path = args.output or _default_output_path(args.suite)
    _write_jsonl(output_path, report)
    print(f"\n📝 결과 저장: {output_path}")

    return 0 if report.failed == 0 else 1


def _print_summary(report: SuiteReport) -> None:
    print(f"\n=== {report.suite} 요약 ===")
    print(f"total={report.total}  passed={report.passed}  failed={report.failed}  hard_fail={report.hard_fail_count}")
    print(f"Exact Match Rate: {report.exact_match_rate:.1%}")
    if report.field_accuracy:
        print("Field Accuracy:")
        for path, acc in sorted(report.field_accuracy.items()):
            print(f"  {path}: {acc:.1%}")


def _default_output_path(suite: str) -> Path:
    timestamp = datetime.now(_KST).strftime("%Y%m%dT%H%M%S")
    return _RESULTS_DIR / f"{suite}_{timestamp}.jsonl"


def _write_jsonl(path: Path, report: SuiteReport) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        # 1줄: 요약, 이후 줄: case 별 결과
        f.write(json.dumps({
            "type": "summary",
            "suite": report.suite,
            "total": report.total,
            "passed": report.passed,
            "failed": report.failed,
            "hard_fail_count": report.hard_fail_count,
            "exact_match_rate": report.exact_match_rate,
            "field_accuracy": report.field_accuracy,
        }, ensure_ascii=False) + "\n")
        for case in report.cases:
            f.write(json.dumps({
                "type": "case",
                "case_id": case.case_id,
                "passed": case.passed,
                "hard_fail": case.hard_fail,
                "error": case.error,
                "latency_ms": case.latency_ms,
                "field_mismatches": [
                    {"path": c.path, "expected": c.expected, "actual": c.actual}
                    for c in case.field_comparisons if not c.match
                ],
            }, ensure_ascii=False, default=str) + "\n")


if __name__ == "__main__":
    sys.exit(main())
