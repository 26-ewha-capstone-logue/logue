import re
from typing import Any

SENSITIVE_PATTERNS = [
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"), "[EMAIL]"),
    (re.compile(r"\b\d{3}[-.]?\d{3,4}[-.]?\d{4}\b"), "[PHONE]"),
    (re.compile(r"\b\d{6}[-]?\d{7}\b"), "[SSN]"),
    (re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b"), "[CARD]"),
]

SENSITIVE_KEYS = {
    "password",
    "secret",
    "token",
    "api_key",
    "apikey",
    "auth",
    "credential",
    "ssn",
    "social_security",
}


def redact_sensitive(data: Any) -> Any:
    """민감 정보 마스킹

    재귀적으로 dict/list를 순회하며 민감 정보를 마스킹
    """
    if isinstance(data, dict):
        return {k: _redact_value(k, v) for k, v in data.items()}
    if isinstance(data, list):
        return [redact_sensitive(item) for item in data]
    if isinstance(data, str):
        return _redact_string(data)
    return data


def _redact_value(key: str, value: Any) -> Any:
    """키 이름 기반 마스킹"""
    key_lower = key.lower()
    if any(sensitive in key_lower for sensitive in SENSITIVE_KEYS):
        if isinstance(value, str):
            return "[REDACTED]"
        return "[REDACTED]"
    return redact_sensitive(value)


def _redact_string(text: str) -> str:
    """문자열 내 패턴 기반 마스킹"""
    result = text
    for pattern, replacement in SENSITIVE_PATTERNS:
        result = pattern.sub(replacement, result)
    return result
