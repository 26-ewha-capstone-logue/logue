import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    """FastAPI 테스트 클라이언트"""
    return TestClient(app)


@pytest.fixture
def sample_file_analysis_request():
    """파일 분석 샘플 요청"""
    return {
        "request_id": "test-001",
        "data_source": {
            "file_name": "sales.csv",
            "row_count": 1000,
            "column_count": 5,
            "columns": [
                {
                    "column_name": "order_date",
                    "data_type": "date",
                    "null_ratio": 0.0,
                    "unique_ratio": 0.3,
                    "sample_values": ["2024-01-01", "2024-01-02", "2024-01-03"],
                },
                {
                    "column_name": "product_id",
                    "data_type": "string",
                    "null_ratio": 0.0,
                    "unique_ratio": 0.8,
                    "sample_values": ["P001", "P002", "P003"],
                },
                {
                    "column_name": "category",
                    "data_type": "string",
                    "null_ratio": 0.05,
                    "unique_ratio": 0.1,
                    "sample_values": ["Electronics", "Clothing", "Food"],
                },
                {
                    "column_name": "amount",
                    "data_type": "integer",
                    "null_ratio": 0.0,
                    "unique_ratio": 0.5,
                    "sample_values": [100, 200, 150],
                },
                {
                    "column_name": "is_returned",
                    "data_type": "boolean",
                    "null_ratio": 0.02,
                    "unique_ratio": 0.002,
                    "sample_values": [True, False, False],
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
                {"code": "NO_DATE_COLUMN", "name": "날짜 컬럼 없음", "comment": "시계열 분석 불가"},
                {"code": "NO_MEASURE", "name": "측정값 없음", "comment": "집계 분석 불가"},
            ],
        },
    }


@pytest.fixture
def sample_question_analysis_request():
    """질문 분석 샘플 요청"""
    return {
        "request_id": "test-002",
        "conversation_id": 1,
        "question": {
            "content": "이번 달 카테고리별 매출 TOP 5를 보여줘",
            "previous_messages": [],
        },
        "data_source": {
            "id": 1,
            "columns": [
                {
                    "column_name": "order_date",
                    "data_type": "date",
                    "semantic_role": "DATE_CRITERIA",
                    "null_ratio": 0.0,
                    "sample_values": ["2024-01-01", "2024-01-02"],
                },
                {
                    "column_name": "category",
                    "data_type": "string",
                    "semantic_role": "DIMENSION",
                    "null_ratio": 0.05,
                    "sample_values": ["Electronics", "Clothing"],
                },
                {
                    "column_name": "amount",
                    "data_type": "integer",
                    "semantic_role": "MEASURE",
                    "null_ratio": 0.0,
                    "sample_values": [100, 200],
                },
            ],
        },
        "catalog": {
            "analysis_types": ["COMPARISON", "RANKING"],
            "metric_types": ["RATIO", "COUNT", "SUM"],
            "predefined_metrics": [
                {
                    "metric_name": "total_sales",
                    "display_name": "총 매출",
                    "metric_type": "SUM",
                    "formula_numerator": "amount",
                    "formula_denominator": None,
                },
            ],
            "supported_periods": ["1D", "1W", "1M", "3M", "1Y"],
            "flow_warning_keys": [],
        },
    }


@pytest.fixture
def sample_result_summary_request():
    """결과 요약 샘플 요청"""
    return {
        "request_id": "test-003",
        "analysis_criteria": {
            "analysis_type": "RANKING",
            "metric_name": "total_sales",
            "metric_display_name": "총 매출",
            "standard_period": "1M",
            "compare_period": None,
            "group_by": ["category"],
            "sort_by": "amount",
            "sort_direction": "desc",
            "limit_num": 5,
        },
        "chart_data": {
            "columns": ["category", "total_sales"],
            "rows": [
                ["Electronics", 15000000],
                ["Clothing", 12000000],
                ["Food", 8000000],
                ["Books", 5000000],
                ["Sports", 3000000],
            ],
        },
        "locale": "ko-KR",
    }
