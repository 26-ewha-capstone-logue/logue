"""02 question_analysis 평가 케이스 spec → QuestionAnalysisRequest payload 변환.

case JSON 의 `spec` 필드는 다음 형식:

```json
{
  "id": "CMP-01",
  "dataset": "dataset-a",
  "override_columns": {"col": {...}},
  "add_columns": [...],
  "question": "이번 주 가입 전환율 ...",
  "catalog_overrides": {"metric_types": ["RATIO", "COUNT"]}
}
```

composer 가 fixture 를 로드 → 변형 적용 → catalog 와 합쳐 full payload 반환.
"""

from __future__ import annotations

import copy
from typing import Any

from eval.loader import apply_dataset_overrides, load_fixture


def compose_request(spec: dict[str, Any]) -> dict[str, Any]:
    """case spec 을 QuestionAnalysisRequest 페이로드로 변환."""
    dataset_id = spec["dataset"]
    fixture = load_fixture(dataset_id)

    dataset = apply_dataset_overrides(
        fixture,
        override_columns=spec.get("override_columns"),
        add_columns=spec.get("add_columns"),
    )

    columns = [_field_to_column(f) for f in dataset.get("fields", [])]

    catalog = copy.deepcopy(load_fixture("catalog"))
    for key, value in (spec.get("catalog_overrides") or {}).items():
        catalog[key] = value

    return {
        "request_id": spec["id"].lower().replace("-", "_"),
        "conversation_id": 1,
        "question": {
            "content": spec["question"],
            "previous_messages": spec.get("previous_messages", []),
        },
        "data_source": {"id": 1, "columns": columns},
        "catalog": catalog,
    }


def _field_to_column(field: dict[str, Any]) -> dict[str, Any]:
    """fixture 의 field 표기 → QuestionAnalysisRequest.data_source.columns[] 형식."""
    return {
        "column_name": field["name"],
        "data_type": field["data_type"],
        "semantic_role": field["role"],
        "null_ratio": field.get("null_ratio", 0.0),
        "sample_values": field.get("sample_values", []),
    }
