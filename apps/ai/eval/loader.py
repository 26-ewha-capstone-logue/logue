"""Eval fixture/case 로드 + dataset 변형 적용.

- fixture: `eval/fixtures/<dataset_id>.json` (ai_test_cast_plan §1 의 dataset-a/b/c 등)
- cases: `eval/cases/<suite>/<category>/<case_id>.json`
- dataset 변형 룰 (case 의 `override_columns` / `add_columns`):
  - override: 기존 컬럼의 특정 필드 수정 또는 `{"remove": true}` 로 제거
  - add: 신규 컬럼 추가 (AMB 시리즈 등)
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any


EVAL_ROOT: Path = Path(__file__).resolve().parent
FIXTURES_DIR: Path = EVAL_ROOT / "fixtures"
CASES_DIR: Path = EVAL_ROOT / "cases"


def load_fixture(dataset_id: str) -> dict[str, Any]:
    """`fixtures/<dataset_id>.json` 본문을 dict 로 반환."""
    path = FIXTURES_DIR / f"{dataset_id}.json"
    if not path.is_file():
        raise FileNotFoundError(f"fixture 파일이 없습니다: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_cases(
    suite: str,
    category: str | None = None,
) -> list[dict[str, Any]]:
    """`cases/<suite>/<category>/*.json` 또는 `cases/<suite>/**/*.json` 로드.

    파일명 정렬 순서로 반환 (case_id 순서 보장). 케이스 없으면 빈 리스트.
    """
    suite_dir = CASES_DIR / suite
    if category:
        suite_dir = suite_dir / category
    if not suite_dir.is_dir():
        return []
    cases: list[dict[str, Any]] = []
    for path in sorted(suite_dir.rglob("*.json")):
        cases.append(json.loads(path.read_text(encoding="utf-8")))
    return cases


def apply_dataset_overrides(
    dataset: dict[str, Any],
    *,
    override_columns: dict[str, dict[str, Any]] | None = None,
    add_columns: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """fixture 의 columns 배열에 override/add 룰을 적용해 deep-copy 반환.

    columns 배열 위치는 `fields` (ai_test_cast_plan 표기) 또는 `columns` 둘 다 지원.
    """
    result = copy.deepcopy(dataset)
    columns_key = "fields" if "fields" in result else "columns"
    columns: list[dict[str, Any]] = result.get(columns_key, [])

    if override_columns:
        columns = _apply_overrides(columns, override_columns)

    if add_columns:
        columns = columns + [copy.deepcopy(c) for c in add_columns]

    result[columns_key] = columns
    return result


def _apply_overrides(
    columns: list[dict[str, Any]],
    overrides: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for col in columns:
        name = col.get("name") or col.get("column_name")
        override = overrides.get(name) if name else None
        if override is None:
            out.append(col)
            continue
        if override.get("remove"):
            continue
        out.append({**col, **{k: v for k, v in override.items() if k != "remove"}})
    return out
