from schemas.result_summary import (
    AnalysisSummaryRequest,
    AnalysisSummaryResponse,
    Description,
    DescriptionSegment,
)


async def describe_analysis_result(request: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    criteria = request.analysis_criteria
    group_label = " · ".join(criteria.group_by)

    if criteria.analysis_type == "COMPARISON":
        emphasis = f"{criteria.compare_period} 대비 {criteria.sort_direction} 순"
        text = f"{criteria.metric_display_name}이 {emphasis}으로 {group_label}를 나열했어요."
    else:
        emphasis = f"{criteria.sort_direction} 순 top {criteria.limit_num}"
        text = f"{criteria.metric_display_name}이 {emphasis}으로 {group_label}를 나열했어요."

    prefix, suffix = text.split(emphasis, 1)
    return AnalysisSummaryResponse(
        request_id=request.request_id,
        description=Description(
            segments=[
                DescriptionSegment(text=prefix, emphasis=False),
                DescriptionSegment(text=emphasis, emphasis=True),
                DescriptionSegment(text=suffix, emphasis=False),
            ],
            plain_text=text,
        ),
    )
