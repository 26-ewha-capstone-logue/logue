from schemas.api.file_analysis import PrimaryCandidates, SourceWarning
from schemas.api.question_analysis import FlowWarning


def detect_source_warnings(candidates: PrimaryCandidates) -> list[SourceWarning]:
    """데이터 소스 경고 감지"""
    warnings: list[SourceWarning] = []

    if not candidates.date_fields:
        warnings.append(
            SourceWarning(
                code="NO_DATE_COLUMN",
                related_columns=["(none)"],
            )
        )

    if not candidates.measures:
        warnings.append(
            SourceWarning(
                code="NO_MEASURE",
                related_columns=["(none)"],
            )
        )

    return warnings


def detect_flow_warnings(
    has_date: bool,
    has_measure: bool,
    missing_columns: list[str],
) -> list[FlowWarning]:
    """분석 흐름 경고 감지"""
    warnings: list[FlowWarning] = []

    if not has_date:
        warnings.append(
            FlowWarning(
                code="NO_DATE_FOR_PERIOD",
                related_fields=[],
                detail="기간 분석을 위한 날짜 컬럼이 없습니다.",
            )
        )

    if not has_measure:
        warnings.append(
            FlowWarning(
                code="NO_AGGREGABLE_MEASURE",
                related_fields=[],
                detail="집계 가능한 측정값 컬럼이 없습니다.",
            )
        )

    if missing_columns:
        warnings.append(
            FlowWarning(
                code="MISSING_COLUMNS",
                related_fields=missing_columns,
                detail=f"다음 컬럼을 찾을 수 없습니다: {', '.join(missing_columns)}",
            )
        )

    return warnings
