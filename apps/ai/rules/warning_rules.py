"""Warning 코드 검증 (catalog 정의 안에 있는지)."""

from __future__ import annotations

from core.errors import ErrorDetail
from schemas.api.question_analysis import (
    FlowWarning,
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)
from schemas.enums import FlowWarningKey, SemanticRoleType


# 분석에 사용된 컬럼의 null 비율이 이 값 이상이면 CRITICAL_NULL_DETECTED 추론.
# 0.3 은 프롬프트/평가 기준과 동일한 임계값.
CRITICAL_NULL_RATIO_THRESHOLD = 0.3


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


def infer_data_warnings(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> list[FlowWarning]:
    """데이터 기반으로 CRITICAL_NULL_DETECTED warning 을 추론한다.

    analysis_criteria 가 참조하는 컬럼(base_date_column / group_by / filters[].field /
    데이터 소스 컬럼과 매칭되는 formula_numerator·denominator) 중 null_ratio 가
    임계값 이상인 컬럼이 있으면 단일 warning 을 반환한다.
    catalog.flow_warning_keys 에 CRITICAL_NULL_DETECTED 가 정의돼 있지 않으면
    추론하지 않는다 (catalog 미정의 코드는 emit 금지).
    """
    criteria = response.analysis_criteria
    if criteria is None:
        return []

    catalog_codes = {w.code for w in request.catalog.flow_warning_keys}
    if FlowWarningKey.CRITICAL_NULL_DETECTED not in catalog_codes:
        return []

    column_names = {c.column_name for c in request.data_source.columns}

    referenced: list[str] = [criteria.base_date_column]
    referenced.extend(criteria.group_by)
    referenced.extend(f.field for f in criteria.filters)
    for formula in (criteria.formula_numerator, criteria.formula_denominator):
        if formula is not None and formula in column_names:
            referenced.append(formula)

    null_ratios = {c.column_name: c.null_ratio for c in request.data_source.columns}

    offending: list[str] = []
    for name in referenced:
        ratio = null_ratios.get(name)
        if ratio is not None and ratio >= CRITICAL_NULL_RATIO_THRESHOLD:
            if name not in offending:
                offending.append(name)

    if not offending:
        return []

    return [
        FlowWarning(
            code=FlowWarningKey.CRITICAL_NULL_DETECTED,
            related_fields=offending,
            detail="분석 사용 컬럼의 null 비율이 임계값을 초과합니다.",
        )
    ]


def infer_date_conflict_warning(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> list[FlowWarning]:
    """데이터 기반으로 DATE_FIELD_CONFLICT warning 을 결정론적으로 추론한다.

    `semantic_role == DATE_CRITERIA` 인 컬럼이 2개 이상이면 기준 날짜가 모호하므로
    충돌로 간주한다. 파일 플로우(`core.rules.date_conflict_warnings`)와 동일한 기준이며,
    여기서는 graded column_roles 대신 요청 data_source 의 semantic_role 을 truth source 로 쓴다.
    catalog.flow_warning_keys 에 DATE_FIELD_CONFLICT 가 정의돼 있지 않으면 추론하지 않는다.
    """
    if response.analysis_criteria is None:
        return []

    catalog_codes = {w.code for w in request.catalog.flow_warning_keys}
    if FlowWarningKey.DATE_FIELD_CONFLICT not in catalog_codes:
        return []

    date_columns = [
        c.column_name
        for c in request.data_source.columns
        if c.semantic_role == SemanticRoleType.DATE_CRITERIA
    ]
    if len(date_columns) <= 1:
        return []

    return [
        FlowWarning(
            code=FlowWarningKey.DATE_FIELD_CONFLICT,
            related_fields=date_columns,
            detail="DATE_CRITERIA 역할 컬럼이 둘 이상이라 기준 날짜가 결정되지 않습니다.",
        )
    ]


def _qdm_name_prefix(column_name: str) -> str:
    """컬럼명의 첫 토큰(`_` 기준, 소문자)을 반환한다.

    suffix 공유(예: `activated_users` 와 `paid_users` 의 `users`)는 정상 데이터셋에서도
    흔하므로 모호 신호로 보지 않는다. prefix 만 비교해 오탐을 피한다.
    """
    return column_name.split("_", 1)[0].lower()


def _is_categorical(col) -> bool:
    """sample_values 겹침이 모호 신호로 의미 있는 범주형(문자열) 컬럼인지 판정한다.

    숫자형(`integer`/`double`) 컬럼은 작은 정수(0/1/2 등)를 자연히 공유하므로 값 겹침이
    모호 신호가 되지 못한다(예: `landing_sessions` 와 `signup_complete`). 값 겹침 신호는
    `string` 컬럼에만 적용한다.
    """
    return getattr(col, "data_type", None) == "string"


def _columns_look_ambiguous(a, b) -> bool:
    """두 컬럼이 같은 의미를 가리킬 가능성(모호)을 결정론적으로 판정한다.

    신호 두 가지 중 하나라도 만족하면 모호로 본다.
    1. 이름 prefix(첫 토큰)를 공유한다 (예: `device`, `device_type`, `device_kind`).
    2. (범주형 한정) sample_values 값 공간이 겹친다 (같은 카테고리 값을 공유 = 같은 축).
       숫자형 컬럼은 정수 공유 오탐을 막기 위해 값 겹침을 보지 않는다.
    """
    if _qdm_name_prefix(a.column_name) == _qdm_name_prefix(b.column_name):
        return True
    if _is_categorical(a) and _is_categorical(b):
        a_vals = {str(v).lower() for v in (a.sample_values or [])}
        b_vals = {str(v).lower() for v in (b.sample_values or [])}
        return bool(a_vals and b_vals and (a_vals & b_vals))
    return False


def infer_qdm_warning(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> list[FlowWarning]:
    """데이터 기반으로 QUESTION_DATA_MISMATCH warning 을 결정론적으로 추론한다.

    role 별 모호 판정 기준이 다르다.
    - FLAG / STATUS_CONDITION: 정상 데이터셋에서 0~1개라 2개 이상이면 곧 모호.
    - DIMENSION / MEASURE: 정상 데이터셋도 복수(채널+디바이스, measure 다수)라 개수만으로는
      판정하지 않는다. 같은 role 컬럼 쌍이 sample_values 가 겹치거나 이름 prefix 를 공유할 때만
      모호로 본다 (`_columns_look_ambiguous`).
    catalog.flow_warning_keys 에 QUESTION_DATA_MISMATCH 가 정의돼 있지 않으면 추론하지 않는다.
    """
    if response.analysis_criteria is None:
        return []

    catalog_codes = {w.code for w in request.catalog.flow_warning_keys}
    if FlowWarningKey.QUESTION_DATA_MISMATCH not in catalog_codes:
        return []

    by_role: dict[SemanticRoleType, list] = {}
    for col in request.data_source.columns:
        by_role.setdefault(col.semantic_role, []).append(col)

    related_fields: list[str] = []

    def _add(names: list[str]) -> None:
        for n in names:
            if n not in related_fields:
                related_fields.append(n)

    # 개수 기준 (singular-by-contract roles)
    for role in (SemanticRoleType.FLAG, SemanticRoleType.STATUS_CONDITION):
        cols = by_role.get(role, [])
        if len(cols) >= 2:
            _add([c.column_name for c in cols])

    # 모호 신호 기준 (plural-by-contract roles)
    for role in (SemanticRoleType.DIMENSION, SemanticRoleType.MEASURE):
        cols = by_role.get(role, [])
        if len(cols) < 2:
            continue
        ambiguous: set[str] = set()
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                if _columns_look_ambiguous(cols[i], cols[j]):
                    ambiguous.add(cols[i].column_name)
                    ambiguous.add(cols[j].column_name)
        _add([c.column_name for c in cols if c.column_name in ambiguous])

    if not related_fields:
        return []

    return [
        FlowWarning(
            code=FlowWarningKey.QUESTION_DATA_MISMATCH,
            related_fields=related_fields,
            detail="동일 의미 컬럼이 둘 이상이라 질문과 데이터 매핑이 모호합니다.",
        )
    ]


def apply_inferred_warnings(
    response: QuestionAnalysisResponse,
    request: QuestionAnalysisRequest,
) -> None:
    """추론된 warning 을 response.warnings 에 코드 기준 dedupe 하며 추가한다.

    동일 code 가 이미 LLM 응답에 존재하면 기존 것을 유지하고 추가하지 않는다.
    """
    existing_codes = {w.code for w in response.warnings}
    inferred = (
        infer_data_warnings(response, request)
        + infer_date_conflict_warning(response, request)
        + infer_qdm_warning(response, request)
    )
    for warning in inferred:
        if warning.code not in existing_codes:
            response.warnings.append(warning)
            existing_codes.add(warning.code)
