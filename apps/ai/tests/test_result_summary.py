from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


def test_describe_analysis_result() -> None:
    response = client.post(
        "/v1/llm/analysis-results/describe",
        json={
            "request_id": "req_summary_001",
            "analysis_criteria": {
                "analysis_type": "COMPARISON",
                "metric_name": "conversion_rate",
                "metric_display_name": "가입 전환율",
                "standard_period": "this_week",
                "compare_period": "last_week",
                "group_by": ["channel", "device_type"],
                "sort_by": "delta_conversion_rate",
                "sort_direction": "asc",
                "limit_num": None,
            },
            "chart_data": {
                "columns": ["channel", "device_type", "delta"],
                "rows": [["organic", "ios", -0.02]],
            },
            "locale": "ko-KR",
        },
    )

    assert response.status_code == 200
    body = response.json()
    segments = body["description"]["segments"]
    assert body["request_id"] == "req_summary_001"
    assert "".join(segment["text"] for segment in segments) == body["description"]["plain_text"]
    assert any(segment["emphasis"] for segment in segments)
