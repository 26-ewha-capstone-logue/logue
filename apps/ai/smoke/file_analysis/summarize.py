#!/usr/bin/env python3
"""smoke 결과 디렉토리를 받아 SUMMARY.md 생성 + 요청 페이로드 마스킹.

호출 형식: `python3 summarize.py results/<run-id>/`

동작:
  1. `<name>.request.json` 의 민감 필드(`sample_values`, `file_name`) 를 마스킹해
     `<name>.request.masked.json` 으로 다시 쓰고 원본은 삭제 (실수 커밋 방지).
  2. `<name>.response.json` 의 column_roles · warnings 를 표 형태로 정리해
     `SUMMARY.md` 를 작성.

응답에는 raw 데이터가 들어가지 않으므로(컬럼명·role·confidence·warning code 만 포함)
응답 파일은 그대로 보관한다.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


SENSITIVE_REQUEST_KEYS = {"sample_values", "file_name"}


def _mask_value(value: Any) -> Any:
    if isinstance(value, list):
        return [f"<masked:{type(v).__name__}>" for v in value]
    return f"<masked:{type(value).__name__}>"


def mask_request(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {
            k: (_mask_value(v) if k in SENSITIVE_REQUEST_KEYS else mask_request(v))
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [mask_request(item) for item in obj]
    return obj


def _format_column_roles(roles: list[dict[str, Any]]) -> str:
    if not roles:
        return "—"
    return "<br>".join(
        f"`{r['column_name']}` → {r['semantic_role']} ({r['confidence']})"
        for r in roles
    )


def _format_warnings(warnings: list[dict[str, Any]]) -> str:
    if not warnings:
        return "`[]`"
    parts = []
    for w in warnings:
        related = w.get("related_columns", [])
        if related:
            parts.append(f"`{w['code']}` ({', '.join(related)})")
        else:
            parts.append(f"`{w['code']}`")
    return "<br>".join(parts)


def _format_primary_candidates(summary: dict[str, Any]) -> str:
    pc = summary.get("primary_candidates", {})
    keys = ["date_fields", "measures", "dimensions", "status_conditions", "flags", "ids"]
    return "<br>".join(
        f"{k}={pc.get(k, [])}"
        for k in keys
    )


def build_summary(run_dir: Path) -> str:
    metas = sorted(run_dir.glob("*.meta.json"))

    lines: list[str] = [
        "# 파일 분석 API smoke 결과",
        "",
        f"- 실행 ID: `{run_dir.name}`",
        f"- 시나리오 수: {len(metas)}",
        "",
        "## 시나리오별 결과",
        "",
        "| # | 케이스 | HTTP | request_id | column_roles | primary_candidates | warnings |",
        "|---|---|---|---|---|---|---|",
    ]

    all_200 = True
    for idx, meta_path in enumerate(metas, start=1):
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        name = meta["name"]
        http = meta["http"]
        if http != "200":
            all_200 = False
        response_path = run_dir / f"{name}.response.json"

        try:
            response = json.loads(response_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, FileNotFoundError):
            response = {}

        request_id = response.get("request_id", "—")
        column_roles_str = _format_column_roles(response.get("column_roles", []))
        warnings_str = _format_warnings(response.get("warnings", []))
        candidates_str = _format_primary_candidates(response.get("data_status_summary", {}))

        lines.append(
            f"| {idx} | `{name}` | {http} | `{request_id}` "
            f"| {column_roles_str} | {candidates_str} | {warnings_str} |"
        )

    lines += [
        "",
        "## 응답·요청 파일",
        "",
    ]
    for meta_path in metas:
        name = json.loads(meta_path.read_text(encoding="utf-8"))["name"]
        lines.append(
            f"- `{name}` — "
            f"[응답]({name}.response.json) · "
            f"[요청 (마스킹됨)]({name}.request.masked.json)"
        )

    lines += [
        "",
        "## 검증 체크리스트",
        "",
        f"- {'✅' if all_200 else '❌'} 모든 시나리오 HTTP 200",
        "- [ ] `request_id` 가 입력값과 일치 (orchestration overwrite 동작)",
        "- [ ] `column_roles[]` 길이 = 입력 컬럼 수, 컬럼명 1:1 매칭",
        "- [ ] `data_status_summary.primary_candidates` 6개 키 모두 노출",
        "- [ ] `DATE_FIELD_CONFLICT` 시나리오의 `warnings[0].code` 가 후처리에서 채워짐",
        "",
        "## 마스킹 정책",
        "",
        "요청 페이로드는 운영 환경에서 PII / 비즈니스 데이터가 들어올 수 있으므로 다음 필드를"
        " smoke 결과 저장 시 일괄 마스킹합니다.",
        "",
        "- `sample_values[]` → 항목별 `<masked:<type>>`",
        "- `file_name` → `<masked:<type>>`",
        "",
        "응답은 컬럼명 · role · confidence · warning code 만 포함하므로 그대로 저장합니다.",
        "마스킹 안 된 원본 요청(`<name>.request.json`) 은 마스킹 적용 후 삭제됩니다.",
        "",
    ]

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("run_dir", type=Path, help="결과 디렉토리 (results/<run-id>)")
    args = parser.parse_args()

    if not args.run_dir.is_dir():
        print(f"❌ {args.run_dir} 는 디렉토리가 아닙니다", file=sys.stderr)
        return 1

    for raw_request in sorted(args.run_dir.glob("*.request.json")):
        masked = mask_request(json.loads(raw_request.read_text(encoding="utf-8")))
        masked_path = raw_request.with_suffix(".masked.json")
        masked_path.write_text(
            json.dumps(masked, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        raw_request.unlink()

    summary = build_summary(args.run_dir)
    summary_path = args.run_dir / "SUMMARY.md"
    summary_path.write_text(summary, encoding="utf-8")
    print(f"✅ {summary_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
