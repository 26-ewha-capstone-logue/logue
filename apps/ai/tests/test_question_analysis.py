import pytest


def test_question_analysis_endpoint(client, sample_question_analysis_request):
    """질문 분석 API 엔드포인트 테스트"""
    response = client.post(
        "/v1/llm/analysis-criteria/resolve",
        json=sample_question_analysis_request,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["request_id"] == sample_question_analysis_request["request_id"]
    assert data["analysis_criteria"] is not None or data["unsupported_question"] is not None


def test_question_analysis_ranking_detection(client, sample_question_analysis_request):
    """RANKING 분석 타입 감지 테스트"""
    response = client.post(
        "/v1/llm/analysis-criteria/resolve",
        json=sample_question_analysis_request,
    )

    data = response.json()

    if data["analysis_criteria"]:
        assert data["analysis_criteria"]["analysis_type"] == "RANKING"
        assert data["analysis_criteria"]["limit_num"] is not None


def test_question_analysis_flow_columns(client, sample_question_analysis_request):
    """flow_columns 반환 테스트"""
    response = client.post(
        "/v1/llm/analysis-criteria/resolve",
        json=sample_question_analysis_request,
    )

    data = response.json()

    assert len(data["flow_columns"]) == len(
        sample_question_analysis_request["data_source"]["columns"]
    )


def test_question_analysis_unsupported_question(client, sample_question_analysis_request):
    """지원하지 않는 질문 테스트"""
    request = sample_question_analysis_request.copy()
    request["data_source"]["columns"] = [
        {
            "column_name": "product_name",
            "data_type": "string",
            "semantic_role": "DIMENSION",
            "null_ratio": 0.0,
            "sample_values": ["A", "B"],
        }
    ]

    response = client.post(
        "/v1/llm/analysis-criteria/resolve",
        json=request,
    )

    data = response.json()
    assert data["unsupported_question"] is not None
