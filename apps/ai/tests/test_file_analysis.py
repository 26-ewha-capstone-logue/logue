from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


def test_analyze_data_source_returns_roles_and_source_warning() -> None:
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
