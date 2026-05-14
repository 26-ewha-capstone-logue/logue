import pytest


def test_file_analysis_endpoint(client, sample_file_analysis_request):
    """파일 분석 API 엔드포인트 테스트"""
    response = client.post(
        "/v1/llm/data-sources/analyze",
        json=sample_file_analysis_request,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["request_id"] == sample_file_analysis_request["request_id"]
    assert len(data["column_roles"]) == len(
        sample_file_analysis_request["data_source"]["columns"]
    )
    assert data["data_status_summary"]["total_rows"] == 1000
    assert data["data_status_summary"]["total_columns"] == 5


def test_file_analysis_column_roles(client, sample_file_analysis_request):
    """컬럼 역할 추론 테스트"""
    response = client.post(
        "/v1/llm/data-sources/analyze",
        json=sample_file_analysis_request,
    )

    data = response.json()
    roles = {r["column_name"]: r["semantic_role"] for r in data["column_roles"]}

    assert roles["order_date"] == "DATE_CRITERIA"
    assert roles["amount"] == "MEASURE"
    assert roles["is_returned"] == "FLAG"


def test_file_analysis_primary_candidates(client, sample_file_analysis_request):
    """primary_candidates 필드 테스트"""
    response = client.post(
        "/v1/llm/data-sources/analyze",
        json=sample_file_analysis_request,
    )

    data = response.json()
    candidates = data["data_status_summary"]["primary_candidates"]

    assert "order_date" in candidates["date_fields"]
    assert "amount" in candidates["measures"]
    assert "is_returned" in candidates["flags"]


def test_file_analysis_validation_error(client):
    """잘못된 요청 검증 테스트"""
    invalid_request = {
        "request_id": "test-invalid",
        "data_source": {
            "file_name": "test.csv",
            "row_count": 100,
            "column_count": 1,
            "columns": [],
        },
        "catalog": {
            "semantic_roles": [],
            "source_warning_keys": [],
        },
    }

    response = client.post(
        "/v1/llm/data-sources/analyze",
        json=invalid_request,
    )

    assert response.status_code == 422
