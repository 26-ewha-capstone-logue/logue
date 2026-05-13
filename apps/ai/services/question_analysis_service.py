import logging

from config.model_config import get_model_config
from config.settings import settings
from llm.client import get_openai_client
from llm.prompt_loader import load_prompt
from llm.structured_outputs import call_structured
from rules.metric_rules import resolve_metric
from schemas.api.question_analysis import (
    AnalysisCriteria,
    FlowColumn,
    FlowWarning,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
    UnsupportedQuestion,
)
from schemas.enums import SemanticRoleType

logger = logging.getLogger(__name__)


async def analyze_question(request: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    """질문 분석 수행

    OpenAI API 키가 없으면 규칙 기반 로직으로 fallback
    """
    if settings.openai_api_key:
        try:
            return await _analyze_with_llm(request)
        except Exception as e:
            logger.warning("LLM call failed, falling back to rules: %s", e)

    return await _analyze_with_rules(request)


async def _analyze_with_llm(request: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    """LLM을 사용한 질문 분석"""
    client = get_openai_client()
    config = get_model_config("question_analysis")
    system_prompt = load_prompt("question_analysis")

    user_content = request.model_dump_json()

    from pydantic import BaseModel, Field

    class LLMAnalysisCriteria(BaseModel):
        analysis_type: str
        metric_name: str
        metric_type: str
        formula_numerator: str | None = None
        formula_denominator: str | None = None
        base_date_column: str
        standard_period: str
        compare_period: str | None = None
        sort_by: str
        sort_direction: str
        group_by: list[str]
        limit_num: int | None = None
        filters: list[dict] = []

    class LLMFlowWarning(BaseModel):
        code: str
        related_fields: list[str] = []
        detail: str | None = None

    class LLMUnsupportedQuestion(BaseModel):
        reason: str
        detected_intent: str | None = None

    class LLMQuestionAnalysisOutput(BaseModel):
        analysis_criteria: LLMAnalysisCriteria | None
        warnings: list[LLMFlowWarning] = []
        unsupported_question: LLMUnsupportedQuestion | None = None

    result = await call_structured(
        client=client,
        config=config,
        system_prompt=system_prompt,
        user_content=user_content,
        response_model=LLMQuestionAnalysisOutput,
    )

    flow_columns = [
        FlowColumn(column_name=col.column_name, semantic_role=col.semantic_role)
        for col in request.data_source.columns
    ]

    analysis_criteria = None
    if result.analysis_criteria:
        analysis_criteria = AnalysisCriteria(**result.analysis_criteria.model_dump())

    warnings = [FlowWarning(**w.model_dump()) for w in result.warnings]

    unsupported = None
    if result.unsupported_question:
        unsupported = UnsupportedQuestion(**result.unsupported_question.model_dump())

    return QuestionAnalysisResponse(
        request_id=request.request_id,
        analysis_criteria=analysis_criteria,
        flow_columns=flow_columns,
        warnings=warnings,
        unsupported_question=unsupported,
    )


async def _analyze_with_rules(request: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    """규칙 기반 질문 분석 (mock/fallback)"""
    question = request.question.content.lower()

    date_columns = [
        col for col in request.data_source.columns
        if col.semantic_role == "DATE_CRITERIA"
    ]
    measure_columns = [
        col for col in request.data_source.columns
        if col.semantic_role == "MEASURE"
    ]
    dimension_columns = [
        col for col in request.data_source.columns
        if col.semantic_role == "DIMENSION"
    ]

    flow_columns = [
        FlowColumn(column_name=col.column_name, semantic_role=col.semantic_role)
        for col in request.data_source.columns
    ]

    if not date_columns or not measure_columns:
        return QuestionAnalysisResponse(
            request_id=request.request_id,
            analysis_criteria=None,
            flow_columns=flow_columns,
            warnings=[],
            unsupported_question=UnsupportedQuestion(
                reason="날짜 또는 측정 컬럼이 없어 분석이 불가능합니다.",
                detected_intent=question[:50],
            ),
        )

    metric = resolve_metric(request.catalog.predefined_metrics, question)
    if not metric:
        metric = request.catalog.predefined_metrics[0]

    is_ranking = any(kw in question for kw in ["top", "순위", "가장", "최고", "최저"])
    analysis_type = "RANKING" if is_ranking else "COMPARISON"

    criteria = AnalysisCriteria(
        analysis_type=analysis_type,
        metric_name=metric.metric_name,
        metric_type=metric.metric_type,
        formula_numerator=metric.formula_numerator,
        formula_denominator=metric.formula_denominator,
        base_date_column=date_columns[0].column_name,
        standard_period=request.catalog.supported_periods[0],
        compare_period=None,
        sort_by=measure_columns[0].column_name,
        sort_direction="desc" if is_ranking else "asc",
        group_by=[dimension_columns[0].column_name] if dimension_columns else [date_columns[0].column_name],
        limit_num=10 if is_ranking else None,
        filters=[],
    )

    return QuestionAnalysisResponse(
        request_id=request.request_id,
        analysis_criteria=criteria,
        flow_columns=flow_columns,
        warnings=[],
        unsupported_question=None,
    )
