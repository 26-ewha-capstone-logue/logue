"""로그 emit 전 민감/대용량 데이터 마스킹 (미팅노트 6️⃣ 보안).

- sample_values 전체, chart_data rows 전체는 저장하지 않고 길이만 기록
- 호출부는 emit 직전에 본 모듈로 입력 payload 를 마스킹한 뒤 hash · 로깅에 사용
- raw prompt / raw response 본문은 호출부가 절대 emit 페이로드에 포함시키지 않음
"""

from __future__ import annotations

from typing import Any


def redact_data_source(data_source: dict[str, Any]) -> dict[str, Any]:
    """`data_source.columns[].sample_values` 를 길이 표시로 치환 (원본은 보존)."""
    redacted = {**data_source}
    if isinstance(redacted.get("columns"), list):
        redacted["columns"] = [
            _redact_column(c) if isinstance(c, dict) else c
            for c in redacted["columns"]
        ]
    return redacted


def _redact_column(column: dict[str, Any]) -> dict[str, Any]:
    redacted = {**column}
    if "sample_values" in redacted:
        values = redacted["sample_values"]
        count = len(values) if isinstance(values, list) else 0
        redacted["sample_values"] = f"<redacted: {count} items>"
    return redacted


def redact_chart_data(chart_data: dict[str, Any]) -> dict[str, Any]:
    """`chart_data.rows` 를 길이 표시로 치환 (columns 는 그대로 유지)."""
    rows = chart_data.get("rows", [])
    row_count = len(rows) if isinstance(rows, list) else 0
    return {
        **chart_data,
        "rows": f"<redacted: {row_count} rows>",
    }
