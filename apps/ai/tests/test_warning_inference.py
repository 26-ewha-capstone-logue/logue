"""warning_rules.infer_data_warnings / apply_inferred_warnings 단위 테스트.

데이터 기반 CRITICAL_NULL_DETECTED 추론 로직만 컴팩트하게 검증한다.
요청/응답 구성은 test_business_validation.py 스타일을 따른다.
"""

from __future__ import annotations

from rules.warning_rules import (
    CRITICAL_NULL_RATIO_THRESHOLD,
    apply_inferred_warnings,
    infer_data_warnings,
    infer_date_conflict_warning,
    infer_qdm_warning,
)
from schemas.api.question_analysis import (
    AnalysisCriteria,
    Catalog,
    DataSource,
    DataSourceColumn,
    Filter,
    FlowWarning,
    FlowWarningKeyCatalog,
    PredefinedMetric,
    Question,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)
from schemas.enums import FlowWarningKey


def _request(*, null_ratio: float = 0.0, with_null_key: bool = True) -> QuestionAnalysisRequest:
    flow_warning_keys: list[FlowWarningKeyCatalog] = []
    if with_null_key:
        flow_warning_keys.append(
            FlowWarningKeyCatalog(
                code="CRITICAL_NULL_DETECTED", name="...", comment="...",
            ),
        )
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
                    null_ratio=null_ratio,
                    sample_values=[],
                ),
                DataSourceColumn(
                    column_name="amount",
                    data_type="double",
                    semantic_role="MEASURE",
                    null_ratio=null_ratio,
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
                    formula_numerator="amount", formula_denominator="b",
                ),
            ],
            supported_periods=["this_week", "last_week"],
            flow_warning_keys=flow_warning_keys,
        ),
    )


def _criteria(**overrides) -> AnalysisCriteria:
    base = dict(
        analysis_type="COMPARISON", metric_name="cr", metric_type="RATIO",
        formula_numerator="amount", formula_denominator="b",
        base_date_column="signed_at",
        standard_period="this_week", compare_period="last_week",
        sort_by="delta", sort_direction="asc",
        group_by=["channel"], limit_num=None, filters=[],
    )
    base.update(overrides)
    return AnalysisCriteria(**base)


def _response(criteria: AnalysisCriteria, warnings=None) -> QuestionAnalysisResponse:
    return QuestionAnalysisResponse(
        request_id="req_X",
        analysis_criteria=criteria,
        warnings=warnings or [],
    )


def test_group_by_high_null_infers_critical_null() -> None:
    warnings = infer_data_warnings(
        _response(_criteria()), _request(null_ratio=0.5),
    )
    assert len(warnings) == 1
    assert warnings[0].code == FlowWarningKey.CRITICAL_NULL_DETECTED
    assert "channel" in (warnings[0].related_fields or [])


def test_all_columns_below_threshold_returns_empty() -> None:
    below = CRITICAL_NULL_RATIO_THRESHOLD - 0.01
    warnings = infer_data_warnings(
        _response(_criteria()), _request(null_ratio=below),
    )
    assert warnings == []


def test_catalog_without_critical_null_key_returns_empty() -> None:
    warnings = infer_data_warnings(
        _response(_criteria()), _request(null_ratio=0.9, with_null_key=False),
    )
    assert warnings == []


def test_apply_dedupes_when_llm_already_emitted() -> None:
    response = _response(
        _criteria(),
        warnings=[FlowWarning(code="CRITICAL_NULL_DETECTED", detail="llm")],
    )
    apply_inferred_warnings(response, _request(null_ratio=0.9))
    null_warnings = [
        w for w in response.warnings
        if w.code == FlowWarningKey.CRITICAL_NULL_DETECTED
    ]
    assert len(null_warnings) == 1
    assert null_warnings[0].detail == "llm"


def test_formula_column_high_null_detected() -> None:
    # group_by(channel) 은 낮고, formula_numerator(amount) 만 임계값 초과.
    req = _request(null_ratio=0.0)
    req.data_source.columns[2].null_ratio = 0.7  # amount
    warnings = infer_data_warnings(_response(_criteria()), req)
    assert len(warnings) == 1
    assert "amount" in (warnings[0].related_fields or [])


def test_apply_appends_when_no_existing_warning() -> None:
    response = _response(_criteria())
    apply_inferred_warnings(response, _request(null_ratio=0.8))
    assert any(
        w.code == FlowWarningKey.CRITICAL_NULL_DETECTED for w in response.warnings
    )


# ---------- DATE_FIELD_CONFLICT 추론 ----------


def _request_with_dates(
    *, date_count: int = 2, with_conflict_key: bool = True
) -> QuestionAnalysisRequest:
    """DATE_CRITERIA 컬럼 수와 catalog 의 DATE_FIELD_CONFLICT 정의 여부를 제어한다."""
    columns = [
        DataSourceColumn(
            column_name=f"date_{i}",
            data_type="datetime",
            semantic_role="DATE_CRITERIA",
            null_ratio=0.0,
            sample_values=[],
        )
        for i in range(date_count)
    ]
    columns.append(
        DataSourceColumn(
            column_name="channel",
            data_type="string",
            semantic_role="DIMENSION",
            null_ratio=0.0,
            sample_values=[],
        )
    )
    flow_warning_keys: list[FlowWarningKeyCatalog] = []
    if with_conflict_key:
        flow_warning_keys.append(
            FlowWarningKeyCatalog(
                code="DATE_FIELD_CONFLICT", name="...", comment="...",
            ),
        )
    return QuestionAnalysisRequest(
        request_id="req_X",
        conversation_id=1,
        question=Question(content="?"),
        data_source=DataSource(id=1, columns=columns),
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
            flow_warning_keys=flow_warning_keys,
        ),
    )


def test_two_date_criteria_infers_conflict() -> None:
    warnings = infer_date_conflict_warning(
        _response(_criteria(base_date_column="date_0")),
        _request_with_dates(date_count=2),
    )
    assert len(warnings) == 1
    assert warnings[0].code == FlowWarningKey.DATE_FIELD_CONFLICT
    assert warnings[0].related_fields == ["date_0", "date_1"]


def test_single_date_criteria_no_conflict() -> None:
    warnings = infer_date_conflict_warning(
        _response(_criteria(base_date_column="date_0")),
        _request_with_dates(date_count=1),
    )
    assert warnings == []


def test_catalog_without_date_conflict_key_returns_empty() -> None:
    warnings = infer_date_conflict_warning(
        _response(_criteria(base_date_column="date_0")),
        _request_with_dates(date_count=2, with_conflict_key=False),
    )
    assert warnings == []


def test_apply_adds_date_conflict_warning() -> None:
    response = _response(_criteria(base_date_column="date_0"))
    apply_inferred_warnings(response, _request_with_dates(date_count=2))
    assert any(
        w.code == FlowWarningKey.DATE_FIELD_CONFLICT for w in response.warnings
    )


# ---------- QUESTION_DATA_MISMATCH 추론 ----------


def _request_with_roles(
    *,
    flag_count: int = 0,
    status_count: int = 0,
    with_qdm_key: bool = True,
) -> QuestionAnalysisRequest:
    """FLAG/STATUS_CONDITION 컬럼 수와 catalog 의 QUESTION_DATA_MISMATCH 정의 여부를 제어한다."""
    columns: list[DataSourceColumn] = [
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
            column_name="device",
            data_type="string",
            semantic_role="DIMENSION",
            null_ratio=0.0,
            sample_values=[],
        ),
    ]
    for i in range(flag_count):
        columns.append(
            DataSourceColumn(
                column_name=f"flag_{i}",
                data_type="boolean",
                semantic_role="FLAG",
                null_ratio=0.0,
                sample_values=[],
            )
        )
    for i in range(status_count):
        columns.append(
            DataSourceColumn(
                column_name=f"status_{i}",
                data_type="string",
                semantic_role="STATUS_CONDITION",
                null_ratio=0.0,
                sample_values=[],
            )
        )
    for name in ("amount", "count", "revenue", "users", "orders"):
        columns.append(
            DataSourceColumn(
                column_name=name,
                data_type="double",
                semantic_role="MEASURE",
                null_ratio=0.0,
                sample_values=[],
            )
        )
    flow_warning_keys: list[FlowWarningKeyCatalog] = []
    if with_qdm_key:
        flow_warning_keys.append(
            FlowWarningKeyCatalog(
                code="QUESTION_DATA_MISMATCH", name="...", comment="...",
            ),
        )
    return QuestionAnalysisRequest(
        request_id="req_X",
        conversation_id=1,
        question=Question(content="?"),
        data_source=DataSource(id=1, columns=columns),
        catalog=Catalog(
            analysis_types=["COMPARISON", "RANKING"],
            metric_types=["RATIO"],
            predefined_metrics=[
                PredefinedMetric(
                    metric_name="cr", display_name="전환율", metric_type="RATIO",
                    formula_numerator="amount", formula_denominator="users",
                ),
            ],
            supported_periods=["this_week", "last_week"],
            flow_warning_keys=flow_warning_keys,
        ),
    )


def test_two_flag_columns_infers_qdm() -> None:
    warnings = infer_qdm_warning(
        _response(_criteria()),
        _request_with_roles(flag_count=2),
    )
    assert len(warnings) == 1
    assert warnings[0].code == FlowWarningKey.QUESTION_DATA_MISMATCH
    assert "flag_0" in (warnings[0].related_fields or [])
    assert "flag_1" in (warnings[0].related_fields or [])


def test_two_status_condition_columns_infers_qdm() -> None:
    warnings = infer_qdm_warning(
        _response(_criteria()),
        _request_with_roles(status_count=2),
    )
    assert len(warnings) == 1
    assert warnings[0].code == FlowWarningKey.QUESTION_DATA_MISMATCH
    assert "status_0" in (warnings[0].related_fields or [])
    assert "status_1" in (warnings[0].related_fields or [])


def test_normal_request_no_qdm() -> None:
    # 1 FLAG, 2 DIMENSION, 5 MEASURE: QDM 기준 미달, warning 없어야 함.
    warnings = infer_qdm_warning(
        _response(_criteria()),
        _request_with_roles(flag_count=1),
    )
    assert warnings == []


def test_catalog_without_qdm_key_returns_empty() -> None:
    warnings = infer_qdm_warning(
        _response(_criteria()),
        _request_with_roles(flag_count=2, with_qdm_key=False),
    )
    assert warnings == []


def test_apply_adds_qdm_warning() -> None:
    response = _response(_criteria())
    apply_inferred_warnings(response, _request_with_roles(flag_count=2))
    assert any(
        w.code == FlowWarningKey.QUESTION_DATA_MISMATCH for w in response.warnings
    )
