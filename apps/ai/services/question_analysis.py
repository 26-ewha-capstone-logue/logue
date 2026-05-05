from schemas.question_analysis import (
    AnalysisCriteria,
    CriteriaFilter,
    FlowColumn,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
    UnsupportedQuestion,
)


async def resolve_analysis_criteria(request: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    question = request.question.content.lower()
    is_ranking = any(token in question for token in ("top", "상위", "하위", "가장 낮", "가장 높"))
    is_comparison = any(token in question for token in ("대비", "비교", "지난주", "전주"))

    if not is_ranking and not is_comparison:
        return QuestionAnalysisResponse(
            request_id=request.request_id,
            analysis_criteria=None,
            flow_columns=[],
            warnings=[],
            unsupported_question=UnsupportedQuestion(
                reason="이번 MVP에서는 comparison/ranking 질문만 지원합니다.",
                detected_intent="unknown",
            ),
        )

    metric = request.catalog.predefined_metrics[0]
    date_column = next(
        column.column_name
        for column in request.data_source.columns
        if column.semantic_role == "DATE_CRITERIA"
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

    criteria = AnalysisCriteria(
        analysis_type="RANKING" if is_ranking else "COMPARISON",
        metric_name=metric.metric_name,
        metric_type=metric.metric_type,
        formula_numerator=metric.formula_numerator,
        formula_denominator=metric.formula_denominator,
        base_date_column=date_column,
        standard_period="this_week",
        compare_period=None if is_ranking else "last_week",
        sort_by=f"delta_{metric.metric_name}" if is_comparison else metric.metric_name,
        sort_direction="asc",
        group_by=group_by,
        limit_num=5 if is_ranking else None,
        filters=filters,
    )

    return QuestionAnalysisResponse(
        request_id=request.request_id,
        analysis_criteria=criteria,
        flow_columns=[
            FlowColumn(column_name=column.column_name, semantic_role=column.semantic_role)
            for column in request.data_source.columns
            if column.column_name in {date_column, *group_by, *(item.field for item in filters)}
        ],
        warnings=[],
        unsupported_question=None,
    )
