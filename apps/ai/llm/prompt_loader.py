"""System prompt 파일 로더.

`apps/ai/prompts/<name>_<version>.system.md` 파일을 읽어 LLMClient 호출 시 system
message 로 전달한다. LRU 캐시로 동일 (name, version) 재요청 시 디스크 I/O 를 피한다.

```python
from llm.prompt_loader import load_system_prompt, prompt_version_id

system_message = load_system_prompt("question_analysis")  # v1 default
log_field = prompt_version_id("question_analysis")  # "question_analysis_v1"
```
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path


PROMPTS_DIR: Path = Path(__file__).resolve().parent.parent / "prompts"


@lru_cache(maxsize=64)
def load_system_prompt(name: str, version: str = "v1") -> str:
    """`prompts/<name>_<version>.system.md` 본문을 UTF-8 문자열로 반환.

    파일이 없으면 FileNotFoundError 를 raise — 호출부는 별도 fallback 없이
    버전 typo / 미작성 prompt 를 즉시 인지하도록 한다.
    """
    path = PROMPTS_DIR / f"{name}_{version}.system.md"
    if not path.is_file():
        raise FileNotFoundError(
            f"system prompt 파일이 없습니다: {path} "
            f"(name={name!r}, version={version!r})"
        )
    return path.read_text(encoding="utf-8")


def prompt_version_id(name: str, version: str = "v1") -> str:
    """observability 로깅용 prompt 버전 식별자 (`question_analysis_v1`)."""
    return f"{name}_{version}"


def clear_cache() -> None:  # noqa: D401
    """[테스트 전용] LRU 캐시 초기화 — 운영 코드에서 직접 호출 금지.

    prompts/ monkeypatch 시 캐시 무효화 용도.
    """
    load_system_prompt.cache_clear()
