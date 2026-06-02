"""LLM 호출 관측·로깅·비용·해시·마스킹 공통 모듈.

서비스 레이어가 LLM 호출 1회의 메타데이터를 누적해 단일 JSONL 이벤트로 emit 한다.
운영은 컨테이너 stdout 을 CloudWatch 가 수집 — 별도 파일 I/O 없음.
"""

from observability.cost import calculate_cost_usd
from observability.hashing import sha256_of
from observability.logger import LLMEventBuilder, emit_event
from observability.recording import record_llm_call
from observability.redaction import redact_chart_data, redact_data_source


__all__ = [
    "LLMEventBuilder",
    "calculate_cost_usd",
    "emit_event",
    "record_llm_call",
    "redact_chart_data",
    "redact_data_source",
    "sha256_of",
]
