import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from config.settings import settings

logger = logging.getLogger(__name__)

LOG_DIR = Path(settings.log_dir)


def _ensure_log_dir() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)


def _get_log_file() -> Path:
    _ensure_log_dir()
    date_str = datetime.now().strftime("%Y-%m-%d")
    return LOG_DIR / f"requests_{date_str}.jsonl"


def log_request(
    request_id: str,
    api_name: str,
    input_data: dict[str, Any],
    input_hash: str,
) -> None:
    """요청 로그 기록"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "type": "request",
        "request_id": request_id,
        "api_name": api_name,
        "input_hash": input_hash,
        "input_size": len(json.dumps(input_data)),
    }

    _write_log(log_entry)
    logger.info("Request logged: %s %s", api_name, request_id)


def log_response(
    request_id: str,
    api_name: str,
    output_data: dict[str, Any],
    output_hash: str,
    duration_ms: float,
    token_usage: dict[str, int] | None = None,
    cost_usd: float | None = None,
) -> None:
    """응답 로그 기록"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "type": "response",
        "request_id": request_id,
        "api_name": api_name,
        "output_hash": output_hash,
        "output_size": len(json.dumps(output_data)),
        "duration_ms": duration_ms,
        "token_usage": token_usage,
        "cost_usd": cost_usd,
    }

    _write_log(log_entry)
    logger.info(
        "Response logged: %s %s (%.2fms)",
        api_name,
        request_id,
        duration_ms,
    )


def log_error(
    request_id: str,
    api_name: str,
    error_type: str,
    error_message: str,
    duration_ms: float,
) -> None:
    """에러 로그 기록"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "type": "error",
        "request_id": request_id,
        "api_name": api_name,
        "error_type": error_type,
        "error_message": error_message,
        "duration_ms": duration_ms,
    }

    _write_log(log_entry)
    logger.error(
        "Error logged: %s %s - %s: %s",
        api_name,
        request_id,
        error_type,
        error_message,
    )


def _write_log(entry: dict[str, Any]) -> None:
    """JSONL 파일에 로그 기록"""
    try:
        log_file = _get_log_file()
        with log_file.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.warning("Failed to write log: %s", e)
