"""LLMInput 정규화 단위 테스트.

각 API 의 `*LLMInput.from_request()` 가 미팅노트 2️⃣ 표 기준으로 필드를 제거·유지하는지
검증한다. 실제 LLM 호출 없이 Pydantic 모델 변환만 검사.
"""

from __future__ import annotations

from schemas.api.file_analysis import (
    Catalog as FileCatalog,
    ColumnMeta,
    DataSourceMeta,
    FileAnalysisRequest,
    SourceWarningKey,
)
from schemas.api.question_analysis import (
    Catalog as QuestionCatalog,
    DataSource,
    DataSourceColumn,
    FlowWarningKeyCatalog,
    PredefinedMetric,
    PreviousMessage,
    Question,
    QuestionAnalysisRequest,
)
from schemas.api.result_summary import (
    AnalysisCriteria,
    AnalysisSummaryRequest,
    ChartData,
)
from schemas.llm_input.file_analysis_input import FileAnalysisLLMInput
from schemas.llm_input.question_analysis_input import QuestionAnalysisLLMInput
from schemas.llm_input.result_summary_input import AnalysisSummaryLLMInput


def _question_request() -> QuestionAnalysisRequest:
    return QuestionAnalysisRequest(
        request_id="req_X",
        conversation_id=184,
        question=Question(
            content="이번 주 전환율?",
            previous_messages=[
                PreviousMessage(role="USER", content="hello"),
                PreviousMessage(role="LOGUE", content="hi"),
            ],
        ),
        data_source=DataSource(
            id=91,
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
        catalog=QuestionCatalog(
            analysis_types=["COMPARISON", "RANKING"],
            metric_types=["RATIO"],
            predefined_metrics=[
                PredefinedMetric(
                    metric_name="cr",
                    display_name="전환율",
                    metric_type="RATIO",
                    formula_numerator="a",
                    formula_denominator="b",
                )
            ],
            supported_periods=["this_week", "last_week"],
            flow_warning_keys=[
                FlowWarningKeyCatalog(
                    code="QUESTION_DATA_MISMATCH",
                    name="질문/데이터 불일치",
                    comment="질문에서 요구한 컬럼이 데이터에 없습니다.",
                ),
                FlowWarningKeyCatalog(
                    code="CRITICAL_NULL_DETECTED",
                    name="critical null",
                    comment="...",
                ),
            ],
        ),
    )


# ---------- 질문분석 ----------


def test_question_analysis_input_strips_conversation_id_and_previous_messages() -> None:
    req = _question_request()

    llm_input = QuestionAnalysisLLMInput.from_request(req)

    assert llm_input.request_id == "req_X"
    assert llm_input.question.content == "이번 주 전환율?"
    assert not hasattr(llm_input, "conversation_id")
    assert not hasattr(llm_input.question, "previous_messages")


def test_question_analysis_input_strips_data_source_id() -> None:
    req = _question_request()

    llm_input = QuestionAnalysisLLMInput.from_request(req)

    assert not hasattr(llm_input.data_source, "id")
    assert [c.column_name for c in llm_input.data_source.columns] == ["signed_at", "channel"]


def test_question_analysis_input_keeps_only_flow_warning_codes() -> None:
    req = _question_request()

    llm_input = QuestionAnalysisLLMInput.from_request(req)

    codes = [fwk.code for fwk in llm_input.catalog.flow_warning_keys]
    assert codes == ["QUESTION_DATA_MISMATCH", "CRITICAL_NULL_DETECTED"]
    first = llm_input.catalog.flow_warning_keys[0]
    assert not hasattr(first, "name")
    assert not hasattr(first, "comment")


def test_question_analysis_input_preserves_catalog_metric_and_period_fields() -> None:
    req = _question_request()

    llm_input = QuestionAnalysisLLMInput.from_request(req)

    assert llm_input.catalog.analysis_types == ["COMPARISON", "RANKING"]
    assert llm_input.catalog.metric_types == ["RATIO"]
    assert llm_input.catalog.supported_periods == ["this_week", "last_week"]
    metric = llm_input.catalog.predefined_metrics[0]
    assert metric.metric_name == "cr"
    assert metric.display_name == "전환율"
    assert metric.formula_numerator == "a"


# ---------- 결과 요약 ----------


def test_result_summary_input_passes_through_all_fields() -> None:
    req = AnalysisSummaryRequest(
        request_id="req_S",
        analysis_criteria=AnalysisCriteria(
            analysis_type="COMPARISON",
            metric_name="cr",
            metric_display_name="전환율",
            standard_period="this_week",
            compare_period="last_week",
            group_by=["channel"],
            sort_by="delta",
            sort_direction="asc",
            limit_num=None,
        ),
        chart_data=ChartData(columns=["channel", "delta"], rows=[["cold_email", -0.02]]),
        locale="ko-KR",
    )

    llm_input = AnalysisSummaryLLMInput.from_request(req)

    assert llm_input.request_id == "req_S"
    assert llm_input.analysis_criteria.metric_name == "cr"
    assert llm_input.chart_data.rows[0] == ["cold_email", -0.02]
    assert llm_input.locale == "ko-KR"


# ---------- 파일 분석 ----------


def test_file_analysis_input_passes_through_request() -> None:
    req = FileAnalysisRequest(
        request_id="req_F",
        data_source=DataSourceMeta(
            file_name="signup.csv",
            row_count=100,
            column_count=1,
            columns=[
                ColumnMeta(
                    column_name="signed_at",
                    data_type="datetime",
                    null_ratio=0.0,
                    unique_ratio=1.0,
                    sample_values=["2024-01-01"],
                )
            ],
        ),
        catalog=FileCatalog(
            semantic_roles=["DATE_CRITERIA"],
            source_warning_keys=[
                SourceWarningKey(code="DATE_FIELD_CONFLICT", name="...", comment="...")
            ],
        ),
    )

    llm_input = FileAnalysisLLMInput.from_request(req)

    assert llm_input.request_id == "req_F"
    assert llm_input.data_source.file_name == "signup.csv"
    assert llm_input.catalog.semantic_roles == ["DATE_CRITERIA"]
