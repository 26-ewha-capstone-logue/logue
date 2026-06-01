import pytest
from fastapi.testclient import TestClient

import main
from schemas.api.file_analysis import (
    ColumnRole,
    DataStatusSummary,
    FileAnalysisResponse,
    PrimaryCandidates,
)
from services import file_analysis_service as svc


client = TestClient(main.app)


_DATE_CONFLICT_PAYLOAD = {
    "request_id": "req_file_warn",
    "data_source": {
        "file_name": "orders.csv",
        "row_count": 50,
        "column_count": 2,
        "columns": [
            {
                "column_name": "ordered_at",
                "data_type": "datetime",
                "null_ratio": 0.0,
                "unique_ratio": 0.9,
                "sample_values": ["2024-01-01T00:00:00Z"],
            },
            {
                "column_name": "paid_at",
                "data_type": "datetime",
                "null_ratio": 0.0,
                "unique_ratio": 0.95,
                "sample_values": ["2024-01-01T10:00:00Z"],
            },
        ],
    },
    "catalog": {
        "semantic_roles": [
            "DATE_CRITERIA",
            "MEASURE",
            "DIMENSION",
            "STATUS_CONDITION",
            "FLAG",
            "ID_CRITERIA",
        ],
        "source_warning_keys": [
            {
                "code": "DATE_FIELD_CONFLICT",
                "name": "Date field conflict",
                "comment": "Choose one date field.",
            }
        ],
    },
}


def test_analyze_data_source_returns_roles_and_source_warning(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ANAL_LLM_MOCK", "true")
    response = client.post(
        "/v1/llm/data-sources/analyze",
        json={
            "request_id": "req_file_001",
            "data_source": {
                "file_name": "signup.csv",
                "row_count": 100,
                "column_count": 3,
                "columns": [
                    {
                        "column_name": "signed_at",
                        "data_type": "datetime",
                        "null_ratio": 0.02,
                        "unique_ratio": 0.98,
                        "sample_values": ["2024-01-01T00:00:00Z"],
                    },
                    {
                        "column_name": "created_at",
                        "data_type": "datetime",
                        "null_ratio": 0.0,
                        "unique_ratio": 0.99,
                        "sample_values": ["2024-01-01T00:00:00Z"],
                    },
                    {
                        "column_name": "channel",
                        "data_type": "string",
                        "null_ratio": 0.0,
                        "unique_ratio": 0.1,
                        "sample_values": ["organic"],
                    },
                ],
            },
            "catalog": {
                "semantic_roles": [
                    "DATE_CRITERIA",
                    "MEASURE",
                    "DIMENSION",
                    "STATUS_CONDITION",
                    "FLAG",
                    "ID_CRITERIA",
                ],
                "source_warning_keys": [
                    {
                        "code": "DATE_FIELD_CONFLICT",
                        "name": "Date field conflict",
                        "comment": "Choose one date field.",
                    }
                ],
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["request_id"] == "req_file_001"
    assert len(body["column_roles"]) == 3
    assert body["data_status_summary"]["primary_candidates"]["date_fields"] == [
        "signed_at",
        "created_at",
    ]
    assert body["warnings"][0]["code"] == "DATE_FIELD_CONFLICT"


def test_file_analysis_rejects_unknown_semantic_role() -> None:
    response = client.post(
        "/v1/llm/data-sources/analyze",
        json={
            "request_id": "req_file_002",
            "data_source": {
                "file_name": "signup.csv",
                "row_count": 1,
                "column_count": 1,
                "columns": [
                    {
                        "column_name": "signed_at",
                        "data_type": "datetime",
                        "null_ratio": 0.0,
                        "unique_ratio": 1.0,
                        "sample_values": ["2024-01-01"],
                    }
                ],
            },
            "catalog": {
                "semantic_roles": ["UNKNOWN_ROLE"],
                "source_warning_keys": [],
            },
        },
    )

    assert response.status_code == 422


def test_llm_call_failure_returns_502_llm_call_failed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """`_call_llm` 이 예외를 raise 하면 502 + `LLM_CALL_FAILED` 로 매핑돼야 한다."""

    def boom(_req):
        raise RuntimeError("upstream down")

    monkeypatch.setattr(svc, "_call_llm", boom)

    response = client.post("/v1/llm/data-sources/analyze", json=_DATE_CONFLICT_PAYLOAD)

    assert response.status_code == 502
    body = response.json()
    assert body["error_code"] == "LLM_CALL_FAILED"
    assert body["request_id"] == "req_file_warn"


def test_date_conflict_derived_from_roles_even_when_candidates_omit_them(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """채점된 `column_roles` 기준으로 DATE_FIELD_CONFLICT 가 결정론적으로 채워져야 한다.

    `core.rules.date_conflict_warnings()` 는 `primary_candidates.date_fields` 가 아니라
    `semantic_role == DATE_CRITERIA` 인 컬럼 수를 보고 판단한다. 따라서 LLM 이
    `date_fields` 에 한 컬럼만 나열했더라도, 역할이 두 개면 경고가 발생하고
    `related_columns` 는 `column_roles` 순서를 따른다.
    """

    def fake_llm(req):
        return FileAnalysisResponse(
            request_id=req.request_id,
            column_roles=[
                ColumnRole(
                    column_name="ordered_at",
                    semantic_role="DATE_CRITERIA",
                    confidence=0.95,
                    display_name="ordered_at",
                ),
                ColumnRole(
                    column_name="paid_at",
                    semantic_role="DATE_CRITERIA",
                    confidence=0.9,
                    display_name="paid_at",
                ),
            ],
            data_status_summary=DataStatusSummary(
                total_rows=50,
                total_columns=2,
                primary_candidates=PrimaryCandidates(
                    # LLM 이 한 컬럼만 date_fields 로 나열했더라도 역할 기준으로 충돌이 잡혀야 한다.
                    date_fields=["ordered_at"],
                    measures=[],
                    dimensions=[],
                    status_conditions=[],
                    flags=[],
                    ids=[],
                ),
            ),
            warnings=[],
        )

    monkeypatch.setattr(svc, "_call_llm", fake_llm)

    response = client.post("/v1/llm/data-sources/analyze", json=_DATE_CONFLICT_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["warnings"][0]["code"] == "DATE_FIELD_CONFLICT"
    assert body["warnings"][0]["related_columns"] == ["ordered_at", "paid_at"]


def test_no_date_conflict_when_single_date_criteria_role(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """DATE_CRITERIA 역할이 하나뿐이면 DATE_FIELD_CONFLICT 가 발생하지 않아야 한다."""

    def fake_llm(req):
        return FileAnalysisResponse(
            request_id=req.request_id,
            column_roles=[
                ColumnRole(
                    column_name="ordered_at",
                    semantic_role="DATE_CRITERIA",
                    confidence=0.95,
                    display_name="ordered_at",
                ),
                ColumnRole(
                    column_name="paid_at",
                    semantic_role="DIMENSION",
                    confidence=0.6,
                    display_name="paid_at",
                ),
            ],
            data_status_summary=DataStatusSummary(
                total_rows=50,
                total_columns=2,
                primary_candidates=PrimaryCandidates(
                    date_fields=["ordered_at"],
                    measures=[],
                    dimensions=["paid_at"],
                    status_conditions=[],
                    flags=[],
                    ids=[],
                ),
            ),
            warnings=[],
        )

    monkeypatch.setattr(svc, "_call_llm", fake_llm)

    response = client.post("/v1/llm/data-sources/analyze", json=_DATE_CONFLICT_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["warnings"] == []


def test_llm_invalid_column_returns_502_llm_output_invalid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """LLM 이 요청에 없던 컬럼명을 반환하면 502 + `LLM_OUTPUT_INVALID` 로 매핑돼야 한다."""

    def fake_llm(req):
        return FileAnalysisResponse(
            request_id=req.request_id,
            column_roles=[
                ColumnRole(
                    column_name="ghost_column",
                    semantic_role="DIMENSION",
                    confidence=0.5,
                    display_name="ghost_column",
                ),
            ],
            data_status_summary=DataStatusSummary(
                total_rows=50,
                total_columns=2,
                primary_candidates=PrimaryCandidates(
                    date_fields=[],
                    measures=[],
                    dimensions=["ghost_column"],
                    status_conditions=[],
                    flags=[],
                    ids=[],
                ),
            ),
            warnings=[],
        )

    monkeypatch.setattr(svc, "_call_llm", fake_llm)

    response = client.post("/v1/llm/data-sources/analyze", json=_DATE_CONFLICT_PAYLOAD)

    assert response.status_code == 502
    body = response.json()
    assert body["error_code"] == "LLM_OUTPUT_INVALID"
