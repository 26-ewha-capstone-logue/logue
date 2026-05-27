"""LLM input/output payload sha256 hash helper.

원본 prompt/response 본문을 저장하지 않고 (보안), 동일 입력 재호출 추적·디버깅용
지문(fingerprint) 만 로그에 기록한다.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any


def sha256_of(payload: Any) -> str:
    """payload 를 정렬된 JSON 으로 직렬화 후 sha256 해시 반환 (`sha256:<hex>` prefix).

    - 키 순서 무관 (sort_keys=True)
    - 한글·유니코드 그대로 (ensure_ascii=False)
    - JSON 직렬화 불가 객체는 str() 로 fallback (datetime · Pydantic 모델 등)
    """
    serialized = json.dumps(
        payload, sort_keys=True, ensure_ascii=False, default=str
    )
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    return f"sha256:{digest}"
