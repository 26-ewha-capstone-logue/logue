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



def test_analyze_data_source_schema_mismatch_returns_422() -> None:
    """
    응답의 column_roles에 요청에 없는 컬럼명이 포함된 경우 422를 반환하는지 검증합니다.

    검증 항목:
        - 422 응답 반환 여부
        - detail 메시지에 문제 컬럼명 포함 여부
    """
    from unittest.mock import patch, AsyncMock
    from schemas.file_analysis import (
        FileAnalysisResponse, ColumnRole, DataStatusSummary, PrimaryCandidates
    )

    client = TestClient(app)

    fake_response = FileAnalysisResponse(
        request_id="req_test_002",
        column_roles=[
            ColumnRole(
                column_name="없는_컬럼",  # 요청에 없는 컬럼명
                semantic_role="DATE_CRITERIA",
                confidence=0.95,
                display_name="더미"
            )
        ],
        data_status_summary=DataStatusSummary(
            total_rows=100,
            total_columns=1,
            primary_candidates=PrimaryCandidates(
                date_fields=[], measures=[], dimensions=[],
                status_conditions=[], flags=[], ids=[]
            )
        ),
        warnings=[]
    )

    with patch("routers.file_analysis.analyze_file", new_callable=AsyncMock) as mock_analyze:
        # _validate_response가 실제로 동작하도록 services.column_ai.analyze_file을 직접 호출
        from services.file_analysis import _validate_response
        async def side_effect(req):
            _validate_response(req, fake_response)
            return fake_response
        mock_analyze.side_effect = side_effect

        request_body = {
            "request_id": "req_test_002",
            "data_source": {
                "file_name": "test.csv",
                "row_count": 100,
                "column_count": 1,
                "columns": [
                    {
                        "column_name": "signed_at",
                        "data_type": "datetime",
                        "null_ratio": 0.0,
                        "unique_ratio": 1.0,
                        "sample_values": ["2024-01-01"]
                    }
                ]
            },
            "catalog": {
                "semantic_roles": ["DATE_CRITERIA"],
                "source_warning_keys": []
            }
        }

        response = client.post("/v1/llm/data-sources/analyze", json=request_body)

    assert response.status_code == 422
    assert "없는_컬럼" in response.json()["detail"]