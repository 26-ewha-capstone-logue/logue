from functools import lru_cache
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


@lru_cache(maxsize=32)
def load_prompt(name: str, version: str = "v1") -> str:
    """프롬프트 파일을 로드합니다.

    Args:
        name: 프롬프트 이름 (예: "file_analysis")
        version: 프롬프트 버전 (기본값: "v1")

    Returns:
        프롬프트 내용
    """
    file_path = PROMPTS_DIR / f"{name}_{version}.system.md"
    if not file_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {file_path}")
    return file_path.read_text(encoding="utf-8")


def clear_prompt_cache() -> None:
    """프롬프트 캐시를 비웁니다. 테스트용."""
    load_prompt.cache_clear()
