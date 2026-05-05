from schemas.file_analysis import PrimaryCandidates, Warning


def source_warnings(candidates: PrimaryCandidates) -> list[Warning]:
    if len(candidates.date_fields) <= 1:
        return []
    return [
        Warning(
            code="DATE_FIELD_CONFLICT",
            related_columns=candidates.date_fields,
        )
    ]
