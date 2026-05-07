"""분석 기준 도출 서비스 레이어 골격.

`resolve()` 가 외부 진입점. 내부 흐름:
1. LLM 호출 → `QuestionAnalysisResponse` 도출 (AI 개발자가 채울 자리)
2. `validate_llm_output(response, req)` 로 셀프 검증
3. 검증 통과 시 response 반환

AI 개발자는 `_call_llm()` 의 본문만 구현하면 된다.
환경변수 `ANAL_LLM_MOCK=true` 일 때는 결정론적 mock 응답을 반환해
Spring 연동/통합 테스트가 LLM 없이도 가능하다.
"""

from __future__ import annotations

import logging
import os

from core.errors import AppError, ErrorDetail, LLMCallFailedError
from schemas.analysis_criteria import (
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
)
from schemas.enums import SemanticRoleType
from services.llm_output_validator import validate_llm_output


_MOCK_ENV = "ANAL_LLM_MOCK"

logger = logging.getLogger("logue_ai")


def resolve(req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    """질문 분석 요청을 받아 셀프 검증을 통과한 응답을 반환한다.

    `_call_llm` 에서 발생한 타임아웃·네트워크·upstream 5xx 등 운영 환경 예외는
    `LLMCallFailedError` 로 변환되어 502 + `LLM_CALL_FAILED` 응답으로 매핑된다.
    `AppError` 는 그대로 통과시켜 셀프 검증 분기 의미를 보존하고,
    `NotImplementedError` 는 골격 단계 가드라 의도적으로 변환하지 않는다.
    """

    try:
        response = _call_llm(req)
    except (AppError, NotImplementedError):
        raise
    except Exception as exc:
        logger.exception("LLM 호출 실패 (request_id=%s)", req.request_id)
        raise LLMCallFailedError(
            f"LLM 호출 실패: {type(exc).__name__}",
            request_id=req.request_id,
            details=[ErrorDetail(reason="업스트림 LLM 호출 중 오류가 발생했습니다.")],
        ) from exc

    validate_llm_output(response, req)
    return response


def _call_llm(req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    """LLM 호출 자리. AI 개발자가 본문을 구현한다.

    `ANAL_LLM_MOCK=true` 가 설정된 경우 결정론적 mock 응답을 반환한다.
    """
    if os.getenv(_MOCK_ENV, "").lower() == "true":
        return _build_mock_response(req)
    raise NotImplementedError(
        "LLM call to be implemented. "
        f"개발/통합 테스트는 {_MOCK_ENV}=true 로 mock 응답을 사용할 수 있다."
    )


def _build_mock_response(req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    """카탈로그/데이터 소스 안의 식별자만 사용해 셀프 검증을 통과하는 mock."""

    metric = req.catalog.predefined_metrics[0]
    date_col = _pick_column(req, SemanticRoleType.DATE_CRITERIA)
    dim_col = _pick_column(req, SemanticRoleType.DIMENSION)

    standard = req.catalog.supported_periods[0]
    compare = req.catalog.supported_periods[1] if len(req.catalog.supported_periods) > 1 else None

    if compare is not None:
        criteria = {
            "analysis_type": "COMPARISON",
            "metric_name": metric.metric_name,
            "metric_type": metric.metric_type.value,
            "formula_numerator": metric.formula_numerator,
            "formula_denominator": metric.formula_denominator,
            "base_date_column": date_col.column_name,
            "standard_period": standard,
            "compare_period": compare,
            "sort_by": "delta",
            "sort_direction": "asc",
            "group_by": [dim_col.column_name],
            "limit_num": None,
            "filters": [],
        }
    else:
        criteria = {
            "analysis_type": "RANKING",
            "metric_name": metric.metric_name,
            "metric_type": metric.metric_type.value,
            "formula_numerator": metric.formula_numerator,
            "formula_denominator": metric.formula_denominator,
            "base_date_column": date_col.column_name,
            "standard_period": standard,
            "compare_period": None,
            "sort_by": "value",
            "sort_direction": "desc",
            "group_by": [dim_col.column_name],
            "limit_num": 5,
            "filters": [],
        }

    return QuestionAnalysisResponse.model_validate({
        "request_id": req.request_id,
        "analysis_criteria": criteria,
        "flow_columns": [],
        "warnings": [],
    })


def _pick_column(req: QuestionAnalysisRequest, role: SemanticRoleType):
    """주어진 시맨틱 롤을 가진 첫 컬럼, 없으면 첫 컬럼 반환."""
    return next(
        (c for c in req.data_source.columns if c.semantic_role == role),
        req.data_source.columns[0],
    )
