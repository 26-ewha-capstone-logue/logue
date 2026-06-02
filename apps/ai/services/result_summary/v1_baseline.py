"""결과 요약 LLM 구현 — v1 baseline.

`analysis_summary.summarize_analysis_result()` 가 호출하는 실제 LLM 구현체.

흐름:
    AnalysisSummaryRequest
    → AnalysisSummaryLLMInput.from_request()   # 불필요 필드 제거 / 정규화
    → LLMClient.complete_structured()            # OpenAI Structured Outputs
    → AnalysisSummaryResponse

system prompt : prompts/result_summary_v1.system.md
model         : gpt-4.1-nano  (config.model_config 참조)
temperature   : 0.1
max_tokens    : 300
"""

from __future__ import annotations

from llm import LLMClient, load_system_prompt
from config.model_config import model_config_for
from observability import record_llm_call
from schemas.api.result_summary import AnalysisSummaryRequest, AnalysisSummaryResponse
from schemas.llm_input.result_summary_input import AnalysisSummaryLLMInput


_client: LLMClient | None = None
_cfg = model_config_for("result_summary")


def _get_client() -> LLMClient:
    """LLMClient 를 처음 호출 시에만 초기화한다 (lazy singleton).

    모듈 임포트 시점에 OPENAI_API_KEY 가 없어도 RuntimeError 가 발생하지 않으며,
    실제 LLM 호출이 필요한 순간에만 초기화된다.
    테스트에서 monkeypatch.setattr(v1_baseline, "_client", mock) 로 주입 가능.
    """
    global _client
    if _client is None:
        _client = LLMClient()
    return _client


def run(req: AnalysisSummaryRequest) -> AnalysisSummaryResponse:
    """LLM을 호출해 AnalysisSummaryResponse를 반환한다.

    예외는 호출부(analysis_summary.summarize_analysis_result)를 거쳐
    main.py의 unhandled_exception_handler가 500으로 처리한다.
    """
    llm_input = AnalysisSummaryLLMInput.from_request(req)

    response, usage = _get_client().complete_structured(
        system_prompt=load_system_prompt("result_summary"),
        user_payload=llm_input.model_dump(exclude={"request_id"}),
        response_model=AnalysisSummaryResponse,
        **_cfg.as_llm_kwargs(),
    )
    record_llm_call(
        api_name="result_summary",
        request_id=req.request_id,
        usage=usage,
        **_cfg.as_llm_kwargs(),
    )
    return response
