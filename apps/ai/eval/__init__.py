"""LLM 출력 품질 평가 하네스 (eval harness).

`.claude/ai_test_cast_plan.md` 의 평가 케이스를 실행해 LLM 응답을 golden set 과
비교하고 Exact Match Rate / Hard-Fail Rate / Field Accuracy 등을 산정한다.

각 API 의 단위 테스트(mock 기반)와는 별도 — 실제 OpenAI 호출 + 응답 품질 측정.
"""

from eval.loader import (
    apply_dataset_overrides,
    load_cases,
    load_fixture,
)
from eval.runner import RunResult, run_case
from eval.scoring import CaseScore, SuiteReport, score_case, summarize_suite


__all__ = [
    "CaseScore",
    "RunResult",
    "SuiteReport",
    "apply_dataset_overrides",
    "load_cases",
    "load_fixture",
    "run_case",
    "score_case",
    "summarize_suite",
]
