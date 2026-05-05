from fastapi.testclient import TestClient
import asyncio

import main
from schemas.question_analysis import QuestionAnalysisRequest
from services.question_analysis import resolve_analysis_criteria


client = TestClient(main.app)


def request_body(question: str) -> dict:
    return {
        "request_id": "req_question_001",
        "conversation_id": 184,
        "question": {"content": question, "previous_messages": []},
        "data_source": {
            "id": 91,
            "columns": [
                {
                    "column_name": "signed_at",
                    "data_type": "datetime",
                    "semantic_role": "DATE_CRITERIA",
                    "null_ratio": 0.02,
                    "sample_values": ["2024-10-01T09:12:00Z"],
                },
                {
                    "column_name": "signup_complete",
                    "data_type": "integer",
                    "semantic_role": "MEASURE",
                    "null_ratio": 0.0,
                    "sample_values": [0, 1],
                },
                {
                    "column_name": "channel",
                    "data_type": "string",
                    "semantic_role": "DIMENSION",
                    "null_ratio": 0.0,
                    "sample_values": ["organic"],
                },
                {
                    "column_name": "internal_test",
                    "data_type": "boolean",
                    "semantic_role": "FLAG",
                    "null_ratio": 0.0,
                    "sample_values": [False, True],
                },
            ],
        },
        "catalog": {
            "analysis_types": ["COMPARISON", "RANKING"],
            "metric_types": ["RATIO", "COUNT", "SUM"],
            "predefined_metrics": [
                {
                    "metric_name": "conversion_rate",
                    "display_name": "Signup conversion rate",
                    "metric_type": "RATIO",
                    "formula_numerator": "signup_complete",
                    "formula_denominator": "landing_sessions",
                }
            ],
            "supported_periods": ["this_week", "last_week"],
            "flow_warning_keys": [],
        },
    }


def test_resolve_comparison_question() -> None:
    response = client.post(
        "/v1/llm/analysis-criteria/resolve",
        json=request_body("compare conversion rate vs last week by channel"),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["analysis_criteria"]["analysis_type"] == "COMPARISON"
    assert body["analysis_criteria"]["compare_period"] == "last_week"
    assert body["unsupported_question"] is None


def test_resolve_mixed_ranking_comparison_uses_consistent_comparison_mode() -> None:
    response = client.post(
        "/v1/llm/analysis-criteria/resolve",
        json=request_body("top 5 compare last week conversion rate by channel"),
    )

    assert response.status_code == 200
    body = response.json()
    criteria = body["analysis_criteria"]
    assert criteria["analysis_type"] == "COMPARISON"
    assert criteria["compare_period"] == "last_week"
    assert criteria["sort_by"] == "delta_conversion_rate"
    assert criteria["limit_num"] is None


def test_resolve_unsupported_question() -> None:
    response = client.post(
        "/v1/llm/analysis-criteria/resolve",
        json=request_body("explain why conversion rate dropped"),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["analysis_criteria"] is None
    assert body["unsupported_question"] is not None


def test_resolve_question_without_date_criteria_is_unsupported() -> None:
    body = request_body("compare conversion rate vs last week by channel")
    body["data_source"]["columns"][0]["semantic_role"] = "DIMENSION"

    response = client.post("/v1/llm/analysis-criteria/resolve", json=body)

    assert response.status_code == 200
    response_body = response.json()
    assert response_body["analysis_criteria"] is None
    assert response_body["unsupported_question"]["detected_intent"] == "missing_date_criteria"


def test_resolve_question_without_predefined_metrics_is_unsupported() -> None:
    request = QuestionAnalysisRequest.model_validate(
        request_body("compare conversion rate vs last week by channel")
    )
    request.catalog.predefined_metrics = []

    response = asyncio.run(resolve_analysis_criteria(request))

    assert response.analysis_criteria is None
    assert response.unsupported_question is not None
    assert response.unsupported_question.detected_intent == "missing_predefined_metric"
