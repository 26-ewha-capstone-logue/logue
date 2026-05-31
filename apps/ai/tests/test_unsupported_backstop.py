"""rules.unsupported_backstop 단위 + resolve() 통합 테스트.

카탈로그(metric_name / period / analysis_type) 밖 식별자를 담은 criteria 가
502 비즈니스 위반 대신 unsupported_question 응답으로 전환되는지 검증.
"""

from __future__ import annotations

import pytest

from rules.unsupported_backstop import detect_unsupported
from schemas.api.question_analysis import (
    AnalysisCriteria,
    Catalog,
    DataSource,
    DataSourceColumn,
    FlowWarningKeyCatalog,
    PredefinedMetric,
    Question,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
    UnsupportedQuestion,
)
from services import analysis_criteria_service as svc


def _request() -> QuestionAnalysisRequest:
    return QuestionAnalysisRequest(
        request_id="req_X",
        conversation_id=1,
        question=Question(content="?"),
        data_source=DataSource(
            id=1,
            columns=[
                DataSourceColumn(
                    column_name="signed_at",
                    data_type="datetime",
                    semantic_role="DATE_CRITERIA",
                    null_ratio=0.0,
                    sample_values=[],
                ),
                DataSourceColumn(
                    column_name="channel",
                    data_type="string",
                    semantic_role="DIMENSION",
                    null_ratio=0.0,
                    sample_values=[],
                ),
                DataSourceColumn(
                    column_name="a",
                    data_type="integer",
                    semantic_role="MEASURE",
                    null_ratio=0.0,
                    sample_values=[],
                ),
                DataSourceColumn(
                    column_name="b",
                    data_type="integer",
                    semantic_role="MEASURE",
                    null_ratio=0.0,
                    sample_values=[],
                ),
            ],
        ),
        catalog=Catalog(
            analysis_types=["COMPARISON", "RANKING"],
            metric_types=["RATIO"],
            predefined_metrics=[
                PredefinedMetric(
                    metric_name="cr", display_name="전환율", metric_type="RATIO",
                    formula_numerator="a", formula_denominator="b",
                ),
            ],
            supported_periods=["this_week", "last_week"],
            flow_warning_keys=[
                FlowWarningKeyCatalog(
                    code="QUESTION_DATA_MISMATCH", name="...", comment="...",
                ),
            ],
        ),
    )


def _criteria(**overrides) -> AnalysisCriteria:
    base = dict(
        analysis_type="COMPARISON", metric_name="cr", metric_type="RATIO",
        formula_numerator="a", formula_denominator="b",
        base_date_column="signed_at",
        standard_period="this_week", compare_period="last_week",
        sort_by="delta", sort_direction="asc",
        group_by=["channel"], limit_num=None, filters=[],
    )
    base.update(overrides)
    return AnalysisCriteria(**base)


def _response(criteria: AnalysisCriteria) -> QuestionAnalysisResponse:
    return QuestionAnalysisResponse(request_id="req_X", analysis_criteria=criteria)


# ---------- detect_unsupported 단위 ----------


def test_unknown_metric_name_returns_unsupported() -> None:
    result = detect_unsupported(_response(_criteria(metric_name="ghost")), _request())
    assert isinstance(result, UnsupportedQuestion)
    assert "ghost" in result.reason
    assert result.detected_intent is None


def test_unknown_standard_period_returns_unsupported() -> None:
    result = detect_unsupported(
        _response(_criteria(standard_period="this_year")), _request(),
    )
    assert isinstance(result, UnsupportedQuestion)
    assert "this_year" in result.reason


def test_unknown_analysis_type_returns_unsupported() -> None:
    req = _request()
    req.catalog.analysis_types = ["RANKING"]
    # RANKING 형태 제약을 만족시켜 criteria 생성 후 catalog 멤버십만 위반시킨다.
    result = detect_unsupported(
        _response(
            _criteria(
                analysis_type="COMPARISON",
                compare_period="last_week",
            )
        ),
        req,
    )
    assert isinstance(result, UnsupportedQuestion)
    assert "COMPARISON" in result.reason


def test_unknown_compare_period_returns_unsupported() -> None:
    result = detect_unsupported(
        _response(_criteria(compare_period="this_year")), _request(),
    )
    assert isinstance(result, UnsupportedQuestion)
    assert "this_year" in result.reason


def test_metric_formula_column_absent_returns_unsupported() -> None:
    """metric_name 은 catalog 에 있으나 그 카탈로그 지표의 formula 컬럼이
    data_source.columns 에 없으면 unsupported."""
    req = _request()
    req.catalog.predefined_metrics[0].formula_numerator = "ghost_col"
    result = detect_unsupported(_response(_criteria()), req)
    assert isinstance(result, UnsupportedQuestion)
    assert "ghost_col" in result.reason


def test_no_date_criteria_column_returns_unsupported() -> None:
    """data_source 에 DATE_CRITERIA 컬럼이 하나도 없으면 unsupported."""
    req = _request()
    for col in req.data_source.columns:
        if col.semantic_role == "DATE_CRITERIA":
            col.semantic_role = "DIMENSION"
    result = detect_unsupported(_response(_criteria()), req)
    assert isinstance(result, UnsupportedQuestion)
    assert "DATE_CRITERIA" in result.reason


def test_fully_valid_criteria_returns_none() -> None:
    assert detect_unsupported(_response(_criteria()), _request()) is None


def test_no_criteria_returns_none() -> None:
    response = QuestionAnalysisResponse(
        request_id="req_X",
        unsupported_question=UnsupportedQuestion(reason="이미 unsupported"),
    )
    assert detect_unsupported(response, _request()) is None


# ---------- resolve() 통합 ----------


def test_resolve_out_of_catalog_metric_yields_unsupported(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """_call_llm 이 카탈로그 밖 metric_name 을 반환하면 resolve() 는
    analysis_criteria 가 None 이고 unsupported_question 이 채워진 응답을 돌려준다."""

    def fake_llm(req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
        return _response(_criteria(metric_name="ghost_metric"))

    monkeypatch.setattr(svc, "_call_llm", fake_llm)

    result = svc.resolve(_request())

    assert result.analysis_criteria is None
    assert result.unsupported_question is not None
    assert "ghost_metric" in result.unsupported_question.reason
    assert result.request_id == "req_X"
