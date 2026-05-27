"""질문 분석 LLM 구현 — v1 baseline.

`analysis_criteria_service._call_llm()` 이 호출하는 실제 LLM 구현체.

흐름:
    QuestionAnalysisRequest
    → QuestionAnalysisLLMInput.from_request()   # 불필요 필드 제거
    → LLMClient.complete_structured()            # OpenAI Structured Outputs
    → QuestionAnalysisResponse

system prompt : prompts/question_analysis_v1.system.md
model         : gpt-4.1-mini  (config.model_config 참조)
temperature   : 0.0
max_tokens    : 1200
"""

from __future__ import annotations

from llm import LLMClient, load_system_prompt
from config.model_config import model_config_for
from schemas.api.question_analysis import QuestionAnalysisRequest, QuestionAnalysisResponse
from schemas.llm_input.question_analysis_input import QuestionAnalysisLLMInput


_client = LLMClient()
_cfg = model_config_for("question_analysis")


def run(req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
    """LLM을 호출해 QuestionAnalysisResponse를 반환한다.

    예외는 호출부(analysis_criteria_service.resolve)가 LLMCallFailedError로 래핑한다.
    """
    llm_input = QuestionAnalysisLLMInput.from_request(req)

    return _client.complete_structured(
        system_prompt=load_system_prompt("question_analysis"),
        user_payload=llm_input.model_dump(exclude={"request_id"}),
        response_model=QuestionAnalysisResponse,
        **_cfg.as_llm_kwargs(),
    )
