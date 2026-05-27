"""rules/ 단위 테스트 — 모듈별 검증 함수 + business_validation facade.

기존 `test_analysis_criteria_resolve.py` 가 end-to-end 502 분기를 커버하므로 본 파일은
룰 함수 단위에서의 violation detail 생성 + facade 분기만 컴팩트하게 검증.
"""

from __future__ import annotations

import pytest

from core.errors import LLMOutputInvalidError, LLMReferenceViolationError
from rules import business_validation
from rules.column_rules import validate_criteria_columns, validate_flow_columns
from rules.metric_rules import validate_catalog_references
from rules.warning_rules import validate_warning_codes
from schemas.api.question_analysis import (
    AnalysisCriteria,
    Catalog,
    DataSource,
    DataSourceColumn,
    Filter,
    FlowColumn,
    FlowWarning,
    FlowWarningKeyCatalog,
    PredefinedMetric,
    Question,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)


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


# ---------- metric_rules ----------


def test_metric_rules_ok_returns_empty() -> None:
    assert validate_catalog_references(_criteria(), _request()) == []


def test_metric_rules_unknown_metric_name() -> None:
    issues = validate_catalog_references(_criteria(metric_name="ghost"), _request())
    assert any("metric_name" in (i.field or "") for i in issues)


def test_metric_rules_unknown_period() -> None:
    issues = validate_catalog_references(
        _criteria(compare_period="this_year"), _request()
    )
    assert any("compare_period" in (i.field or "") for i in issues)


# ---------- column_rules ----------


def test_column_rules_ok_returns_empty() -> None:
    assert validate_criteria_columns(_criteria(), _request()) == []


def test_column_rules_unknown_group_by() -> None:
    issues = validate_criteria_columns(
        _criteria(group_by=["ghost_col"]), _request(),
    )
    assert any("group_by" in (i.field or "") for i in issues)


def test_column_rules_unknown_filter_field() -> None:
    issues = validate_criteria_columns(
        _criteria(filters=[Filter(field="ghost_col", operator="=", value="x")]),
        _request(),
    )
    assert any("filters" in (i.field or "") for i in issues)


def test_flow_columns_role_mismatch() -> None:
    response = QuestionAnalysisResponse(
        request_id="req_X",
        analysis_criteria=_criteria(),
        flow_columns=[FlowColumn(column_name="signed_at", semantic_role="DIMENSION")],
    )
    issues = validate_flow_columns(response, _request())
    assert any("semantic_role" in (i.field or "") for i in issues)


# ---------- warning_rules ----------


def test_warning_rules_unknown_code() -> None:
    response = QuestionAnalysisResponse(
        request_id="req_X",
        analysis_criteria=_criteria(),
        warnings=[FlowWarning(code="CRITICAL_NULL_DETECTED")],
    )
    issues = validate_warning_codes(response, _request())
    assert any("warnings" in (i.field or "") for i in issues)


# ---------- business_validation facade ----------


def test_validate_passes_for_valid_response() -> None:
    response = QuestionAnalysisResponse(
        request_id="req_X", analysis_criteria=_criteria(),
    )
    business_validation.validate(response, _request())  # raises None


def test_validate_raises_reference_violation() -> None:
    response = QuestionAnalysisResponse(
        request_id="req_X",
        analysis_criteria=_criteria(metric_name="ghost"),
    )
    with pytest.raises(LLMReferenceViolationError):
        business_validation.validate(response, _request())


def test_validate_raises_shape_violation_on_mutual_exclusion() -> None:
    response = QuestionAnalysisResponse.model_construct(
        request_id="req_X",
        analysis_criteria=None,
        unsupported_question=None,
        flow_columns=[],
        warnings=[],
    )
    with pytest.raises(LLMOutputInvalidError):
        business_validation.validate(response, _request())
