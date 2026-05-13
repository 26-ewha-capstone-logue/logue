import pytest


def test_result_summary_endpoint(client, sample_result_summary_request):
    """결과 요약 API 엔드포인트 테스트"""
    response = client.post(
        "/v1/llm/analysis-results/describe",
        json=sample_result_summary_request,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["request_id"] == sample_result_summary_request["request_id"]
    assert "description" in data
    assert "segments" in data["description"]
    assert "plain_text" in data["description"]


def test_result_summary_segments_match_plain_text(client, sample_result_summary_request):
    """segments와 plain_text 일치 테스트"""
    response = client.post(
        "/v1/llm/analysis-results/describe",
        json=sample_result_summary_request,
    )

    data = response.json()
    description = data["description"]

    joined = "".join(seg["text"] for seg in description["segments"])
    assert joined == description["plain_text"]


def test_result_summary_has_emphasis(client, sample_result_summary_request):
    """emphasis 세그먼트 존재 테스트"""
    response = client.post(
        "/v1/llm/analysis-results/describe",
        json=sample_result_summary_request,
    )

    data = response.json()
    segments = data["description"]["segments"]

    has_emphasis = any(seg["emphasis"] for seg in segments)
    assert has_emphasis, "결과 요약에는 최소 1개의 강조 세그먼트가 있어야 합니다"


def test_result_summary_empty_rows(client, sample_result_summary_request):
    """빈 데이터 결과 요약 테스트"""
    request = sample_result_summary_request.copy()
    request["chart_data"] = {
        "columns": ["category", "total_sales"],
        "rows": [],
    }

    response = client.post(
        "/v1/llm/analysis-results/describe",
        json=request,
    )

    assert response.status_code == 200
    data = response.json()
    assert "데이터가 없습니다" in data["description"]["plain_text"]
