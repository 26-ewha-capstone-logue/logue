from schemas.api.question_analysis import PredefinedMetric


def resolve_metric(
    predefined_metrics: list[PredefinedMetric],
    question: str,
) -> PredefinedMetric | None:
    """질문에서 메트릭 이름을 찾아 매칭"""
    question_lower = question.lower()

    for metric in predefined_metrics:
        if metric.metric_name.lower() in question_lower:
            return metric
        if metric.display_name.lower() in question_lower:
            return metric

    return None


def validate_metric(
    metric_name: str,
    predefined_metrics: list[PredefinedMetric],
) -> bool:
    """메트릭이 사전 정의된 목록에 있는지 검증"""
    return any(m.metric_name == metric_name for m in predefined_metrics)


def get_metric_by_name(
    metric_name: str,
    predefined_metrics: list[PredefinedMetric],
) -> PredefinedMetric | None:
    """메트릭 이름으로 메트릭 객체 조회"""
    for metric in predefined_metrics:
        if metric.metric_name == metric_name:
            return metric
    return None
