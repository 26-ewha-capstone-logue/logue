import re

from schemas.question_analysis import (
    AnalysisCriteria,
    CriteriaFilter,
    FlowColumn,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
    UnsupportedQuestion,
)


def has_keyword(question: str, keywords: tuple[str, ...]) -> bool:
    return any(
        re.search(rf"\b{re.escape(keyword)}\b", question) is not None
        for keyword in keywords
    )


async def resolve_analysis_criteria(request: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    question = request.question.content.lower()
    is_ranking = has_keyword(question, ("top", "ranking"))
    is_comparison = has_keyword(question, ("compare", "last week", "vs"))

    if not is_ranking and not is_comparison:
        return QuestionAnalysisResponse(
            request_id=request.request_id,
            analysis_criteria=None,
            flow_columns=[],
            warnings=[],
            unsupported_question=UnsupportedQuestion(
                reason="Only comparison/ranking questions are supported in this MVP.",
                detected_intent="unknown",
            ),
        )

    mode = "COMPARISON" if is_comparison else "RANKING"
    if not request.catalog.predefined_metrics:
        return QuestionAnalysisResponse(
            request_id=request.request_id,
            analysis_criteria=None,
            flow_columns=[],
            warnings=[],
            unsupported_question=UnsupportedQuestion(
                reason="At least one predefined metric is required for analysis criteria.",
                detected_intent="missing_predefined_metric",
            ),
        )

    metric = request.catalog.predefined_metrics[0]
    date_column = next(
        (
            column.column_name
            for column in request.data_source.columns
            if column.semantic_role == "DATE_CRITERIA"
        ),
        None,
    )
    if date_column is None:
        return QuestionAnalysisResponse(
            request_id=request.request_id,
            analysis_criteria=None,
            flow_columns=[],
            warnings=[],
            unsupported_question=UnsupportedQuestion(
                reason="DATE_CRITERIA semantic role column is required for analysis criteria.",
                detected_intent="missing_date_criteria",
            ),
        )

    group_by = [
        column.column_name
        for column in request.data_source.columns
        if column.semantic_role == "DIMENSION"
    ][:2] or [request.data_source.columns[0].column_name]
    filters = [
        CriteriaFilter(field=column.column_name, operator="=", value=False)
        for column in request.data_source.columns
        if column.semantic_role == "FLAG"
    ]

    compare_period = "last_week" if mode == "COMPARISON" else None
    sort_by = f"delta_{metric.metric_name}" if mode == "COMPARISON" else metric.metric_name

    criteria = AnalysisCriteria(
        analysis_type=mode,
        metric_name=metric.metric_name,
        metric_type=metric.metric_type,
        formula_numerator=metric.formula_numerator,
        formula_denominator=metric.formula_denominator,
        base_date_column=date_column,
        standard_period="this_week",
        compare_period=compare_period,
        sort_by=sort_by,
        sort_direction="asc",
        group_by=group_by,
        limit_num=5 if mode == "RANKING" else None,
        filters=filters,
    )

    flow_column_names = {date_column, *group_by, *(item.field for item in filters)}
    return QuestionAnalysisResponse(
        request_id=request.request_id,
        analysis_criteria=criteria,
        flow_columns=[
            FlowColumn(column_name=column.column_name, semantic_role=column.semantic_role)
            for column in request.data_source.columns
            if column.column_name in flow_column_names
        ],
        warnings=[],
        unsupported_question=None,
    )
