import hashlib
import json
from typing import Any


def hash_input(data: dict[str, Any]) -> str:
    """입력 데이터의 SHA-256 해시 생성"""
    return _compute_hash(data)


def hash_output(data: dict[str, Any]) -> str:
    """출력 데이터의 SHA-256 해시 생성"""
    return _compute_hash(data)


def _compute_hash(data: dict[str, Any]) -> str:
    """데이터의 SHA-256 해시 계산

    JSON 직렬화 후 해시하여 일관된 결과 보장
    """
    serialized = json.dumps(data, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]


def verify_hash(data: dict[str, Any], expected_hash: str) -> bool:
    """해시 검증"""
    return _compute_hash(data) == expected_hash
