"""Warning 코드 검증 (catalog 정의 안에 있는지)."""

from __future__ import annotations

from core.errors import ErrorDetail
from schemas.api.question_analysis import (
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)


def validate_warning_codes(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> list[ErrorDetail]:
    """warnings[].code 가 catalog.flow_warning_keys 에 정의된 코드인지."""
    issues: list[ErrorDetail] = []
    catalog_codes = {w.code for w in request.catalog.flow_warning_keys}

    for w in response.warnings:
        if w.code not in catalog_codes:
            issues.append(ErrorDetail(
                field="warnings[].code",
                reason=f"'{w.code}' 은 catalog.flow_warning_keys 에 없습니다.",
            ))

    return issues


# TODO: LLM 응답에 warning 이 없을 때 데이터 기반으로 warning 추론 추가:
# - critical_null_detected: criteria.group_by 컬럼 중 null_ratio >= 임계값
# - question_data_mismatch: 질문 vs data_source 컬럼 미스매치
# 본 PR 는 LLM emit 한 코드 검증만, 추론은 LLM 연동 시 함께 도입.
