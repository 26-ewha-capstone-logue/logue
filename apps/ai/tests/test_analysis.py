from fastapi.testclient import TestClient
import main

app = main.app


def test_analyze_data_source() -> None:
    """
    파일 분석 엔드포인트 동작을 검증합니다.

    검증 항목:
        - 200 응답 반환 여부
        - request_id 일치 여부
        - column_roles 1개 이상 존재 여부
        - data_status_summary 포함 여부
        - warnings 포함 여부
    """
        
    client = TestClient(app)

    request_body = {
        "request_id": "req_test_001",
        "data_source": {
            "file_name": "test.csv",
            "row_count": 100,
            "column_count": 3,
            "columns": [
                {
                    "column_name": "signed_at",
                    "data_type": "datetime",
                    "null_ratio": 0.02,
                    "unique_ratio": 0.98,
                    "sample_values": ["2024-01-01T00:00:00Z"]
                }
            ]
        },
        "catalog": {
            "semantic_roles": ["DATE_CRITERIA", "MEASURE", "DIMENSION"],
            "source_warning_keys": [
                {
                    "code": "DATE_FIELD_CONFLICT",
                    "name": "날짜 기준을 하나로 정할 수 없어요",
                    "comment": "어떤 날짜를 기준으로 볼지 선택하여 질문해 주세요."
                }
            ]
        }
    }

    response = client.post("/v1/llm/data-sources/analyze", json=request_body)

    assert response.status_code == 200
    body = response.json()
    assert body["request_id"] == "req_test_001"
    assert len(body["column_roles"]) >= 1
    assert "data_status_summary" in body
    assert "warnings" in body