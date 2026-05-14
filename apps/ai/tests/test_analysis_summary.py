from fastapi.testclient import TestClient
import main

app = main.app


def _valid_request_body() -> dict:
    """COMPARISON 기본 happy 요청 페이로드를 반환합니다."""
    return {
        "request_id": "req_test_001",
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
            "rows": [["cold_email", "ios", -0.02]],
        },
        "locale": "ko-KR",
    }


def test_summarize_analysis_result() -> None:
    """
    결과 요약 엔드포인트의 더미 응답 동작을 검증합니다.

    검증 항목:
        - 200 응답 반환 여부
        - request_id 일치 여부 (echo)
        - description.segments 1개 이상 존재 여부
        - segments[].text 합과 plain_text 일치 여부
    """

    client = TestClient(app)

    response = client.post("/v1/llm/analysis-results/describe", json=_valid_request_body())

    assert response.status_code == 200
    body = response.json()
    assert body["request_id"] == "req_test_001"
    assert "description" in body
    segments = body["description"]["segments"]
    assert len(segments) >= 1
    joined = "".join(seg["text"] for seg in segments)
    assert joined == body["description"]["plain_text"]


def test_summarize_segments_plain_text_mismatch_returns_422() -> None:
    """
    segments[].text를 이어붙인 결과가 plain_text와 다른 경우 422를 반환하는지 검증합니다.

    검증 항목:
        - 422 응답 반환 여부
        - detail 메시지에 불일치 안내 포함 여부
    """
    from unittest.mock import patch, AsyncMock
    from schemas.analysis_summary import (
        AnalysisSummaryResponse, Description, Segment,
    )

    client = TestClient(app)

    fake_response = AnalysisSummaryResponse(
        request_id="req_test_002",
        description=Description(
            segments=[
                Segment(text="hello", emphasis=False),
            ],
            plain_text="goodbye",  # segments 합과 불일치
        ),
    )

    with patch(
        "routers.analysis_summary.summarize_analysis_result",
        new_callable=AsyncMock,
    ) as mock_summarize:
        from services.analysis_summary import _validate_response
        from schemas.analysis_summary import AnalysisSummaryRequest

        async def side_effect(req: AnalysisSummaryRequest):
            _validate_response(req, fake_response)
            return fake_response

        mock_summarize.side_effect = side_effect

        request_body = _valid_request_body()
        request_body["request_id"] = "req_test_002"

        response = client.post("/v1/llm/analysis-results/describe", json=request_body)

    assert response.status_code == 422
    assert "plain_text" in response.json()["detail"]


def test_comparison_without_compare_period_returns_422() -> None:
    """
    analysis_type=COMPARISON인데 compare_period가 null인 요청은 422를 반환합니다.
    """

    client = TestClient(app)

    request_body = _valid_request_body()
    request_body["analysis_criteria"]["compare_period"] = None

    response = client.post("/v1/llm/analysis-results/describe", json=request_body)

    assert response.status_code == 422


def test_comparison_with_blank_compare_period_returns_422() -> None:
    """
    analysis_type=COMPARISON인데 compare_period가 빈 문자열/공백이면 422를 반환합니다.
    """

    client = TestClient(app)

    for blank in ("", "   "):
        request_body = _valid_request_body()
        request_body["analysis_criteria"]["compare_period"] = blank

        response = client.post("/v1/llm/analysis-results/describe", json=request_body)

        assert response.status_code == 422, f"blank={blank!r} 응답: {response.status_code}"


def test_ranking_without_limit_num_returns_422() -> None:
    """
    analysis_type=RANKING인데 limit_num이 null인 요청은 422를 반환합니다.
    """

    client = TestClient(app)

    request_body = _valid_request_body()
    request_body["analysis_criteria"]["analysis_type"] = "RANKING"
    request_body["analysis_criteria"]["compare_period"] = None
    request_body["analysis_criteria"]["limit_num"] = None

    response = client.post("/v1/llm/analysis-results/describe", json=request_body)

    assert response.status_code == 422


def test_chart_data_row_length_mismatch_returns_422() -> None:
    """
    chart_data.rows의 각 행 길이가 columns 길이와 다르면 422를 반환합니다.
    """

    client = TestClient(app)

    request_body = _valid_request_body()
    request_body["chart_data"] = {
        "columns": ["channel", "device_type"],
        "rows": [["only_one"]],  # columns 길이 2와 불일치
    }

    response = client.post("/v1/llm/analysis-results/describe", json=request_body)

    assert response.status_code == 422
