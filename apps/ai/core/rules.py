from schemas.file_analysis import PrimaryCandidates, SourceWarning


def source_warnings(candidates: PrimaryCandidates) -> list[SourceWarning]:
    if len(candidates.date_fields) <= 1:
        return []
    return [
        SourceWarning(
            code="DATE_FIELD_CONFLICT",
            related_columns=candidates.date_fields,
        )
    ]
