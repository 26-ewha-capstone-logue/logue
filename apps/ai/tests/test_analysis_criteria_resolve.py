"""POST /v1/llm/analysis-criteria/resolve 통합 테스트.

- 정상 200 (mock 경로)
- 입력 검증 422: 필수 누락 / enum 위반 / cross-field 위반
- LLM 출력 검증 502: 참조 위반 / 상호배타 위반
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import main
from schemas.analysis_criteria import (
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)
from services import analysis_criteria_service as svc


ENDPOINT = "/v1/llm/analysis-criteria/resolve"
client = TestClient(main.app)


def _valid_request_payload() -> dict:
    return {
        "request_id": "req_X",
        "conversation_id": 184,
        "question": {"content": "이번 주 전환율?"},
        "data_source": {
            "id": 91,
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
                "metric_name": "cr", "display_name": "전환율",
                "metric_type": "RATIO",
                "formula_numerator": "a", "formula_denominator": "b",
            }],
            "supported_periods": ["this_week", "last_week"],
            "flow_warning_keys": [{
                "code": "QUESTION_DATA_MISMATCH", "name": "...", "comment": "...",
            }],
        },
    }


# ---------- 정상 200 ----------


def test_resolve_returns_200_with_mock_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ANAL_LLM_MOCK", "true")

    response = client.post(ENDPOINT, json=_valid_request_payload())

    assert response.status_code == 200
    body = response.json()
    assert body["request_id"] == "req_X"
    assert body["analysis_criteria"]["analysis_type"] == "COMPARISON"


# ---------- 입력 검증 422 ----------


def test_missing_required_field_returns_422() -> None:
    payload = _valid_request_payload()
    del payload["request_id"]

    response = client.post(ENDPOINT, json=payload)

    assert response.status_code == 422
    body = response.json()
    assert body["error_code"] == "REQUEST_VALIDATION_FAILED"
    assert any(
        "request_id" in (d.get("field") or "") for d in body["details"]
    )


def test_enum_violation_returns_422() -> None:
    payload = _valid_request_payload()
    payload["catalog"]["analysis_types"] = ["UNKNOWN"]

    response = client.post(ENDPOINT, json=payload)

    assert response.status_code == 422
    assert response.json()["error_code"] == "REQUEST_VALIDATION_FAILED"


def test_cross_field_violation_returns_422() -> None:
    """RATIO 지표인데 formula 누락 → predefined_metrics 의 cross-field validator."""
    payload = _valid_request_payload()
    payload["catalog"]["predefined_metrics"][0]["formula_numerator"] = None
    payload["catalog"]["predefined_metrics"][0]["formula_denominator"] = None

    response = client.post(ENDPOINT, json=payload)

    assert response.status_code == 422
    assert response.json()["error_code"] == "REQUEST_VALIDATION_FAILED"


# ---------- LLM 출력 검증 502 ----------


def test_unknown_metric_name_returns_502_reference(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """LLM 이 카탈로그에 없는 metric_name 을 반환 → LLM_REFERENCE_VIOLATION."""

    def fake_llm(req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
        return QuestionAnalysisResponse.model_validate({
            "request_id": req.request_id,
            "analysis_criteria": {
                "analysis_type": "COMPARISON",
                "metric_name": "ghost_metric",
                "metric_type": "RATIO",
                "formula_numerator": "a", "formula_denominator": "b",
                "base_date_column": "signed_at",
                "standard_period": "this_week", "compare_period": "last_week",
                "sort_by": "x", "sort_direction": "asc",
                "group_by": ["channel"],
            },
        })

    monkeypatch.setattr(svc, "_call_llm", fake_llm)

    response = client.post(ENDPOINT, json=_valid_request_payload())

    assert response.status_code == 502
    body = response.json()
    assert body["error_code"] == "LLM_REFERENCE_VIOLATION"
    assert any(
        "metric_name" in (d.get("field") or "") for d in body["details"]
    )


def test_mutual_exclusion_violation_returns_502_output_invalid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """LLM 이 analysis_criteria/unsupported_question 둘 다 비워 반환 → LLM_OUTPUT_INVALID.

    Pydantic 우회를 시뮬레이션하기 위해 `model_construct` 로 응답을 만든다.
    """

    def fake_llm(req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
        return QuestionAnalysisResponse.model_construct(
            request_id=req.request_id,
            analysis_criteria=None,
            unsupported_question=None,
            flow_columns=[],
            warnings=[],
        )

    monkeypatch.setattr(svc, "_call_llm", fake_llm)

    response = client.post(ENDPOINT, json=_valid_request_payload())

    assert response.status_code == 502
    assert response.json()["error_code"] == "LLM_OUTPUT_INVALID"


# ---------- LLM 호출 실패 502 ----------


def test_llm_call_failure_returns_502_call_failed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """LLM 호출 자체가 타임아웃/네트워크 예외로 실패 → LLM_CALL_FAILED."""

    def boom(req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
        raise TimeoutError("upstream timed out")

    monkeypatch.setattr(svc, "_call_llm", boom)

    response = client.post(ENDPOINT, json=_valid_request_payload())

    assert response.status_code == 502
    body = response.json()
    assert body["error_code"] == "LLM_CALL_FAILED"
    assert body["request_id"] == "req_X"
    assert all("upstream timed out" not in (d.get("reason") or "") for d in body["details"])
    assert any("업스트림" in (d.get("reason") or "") for d in body["details"])
