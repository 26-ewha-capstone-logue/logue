"""환경변수 접근 함수.

서비스/LLM 모듈이 직접 `os.getenv()` 를 부르지 않고 본 모듈의 헬퍼만 사용한다.
함수 형태로 제공해 테스트의 `monkeypatch.setenv()` 와 호환된다 (module-level 상수는
import 시점에 한 번만 평가되어 monkeypatch 가 안 먹힘).
"""

from __future__ import annotations

import os


_MOCK_ENV = "ANAL_LLM_MOCK"


def openai_api_key() -> str | None:
    """`OPENAI_API_KEY` env 값 (없으면 None). 운영은 SSM 에서 주입."""
    return os.getenv("OPENAI_API_KEY")


def openai_timeout_sec(default: float = 30.0) -> float:
    """`OPENAI_TIMEOUT_SEC` env 값 (없으면 default)."""
    raw = os.getenv("OPENAI_TIMEOUT_SEC")
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        raise ValueError(
            f"OPENAI_TIMEOUT_SEC 값이 유효한 숫자가 아닙니다: {raw!r}"
        )

def is_mock_mode() -> bool:
    """`ANAL_LLM_MOCK=true` — 모든 LLM 엔드포인트 공통 mock 토글.

    True 일 때 서비스 레이어는 LLM 호출 없이 결정론적 mock 응답을 반환한다 (테스트·통합 검증용).
    """
    return os.getenv(_MOCK_ENV, "").lower() == "true"
