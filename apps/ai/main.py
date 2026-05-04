import logging
import os
import traceback
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from urllib.error import URLError
from urllib.request import urlopen

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from routers.file_analysis import router as anal_router


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("logue_ai")

UPSTREAM_HEALTH_URL = os.getenv("UPSTREAM_HEALTH_URL", "https://ai.logue-kr.site/health")
UPSTREAM_TIMEOUT_SEC = float(os.getenv("UPSTREAM_TIMEOUT_SEC", "3"))
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")

KST = timezone(timedelta(hours=9))


async def _post_discord(payload: dict) -> None:
    if not DISCORD_WEBHOOK_URL:
        return
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(DISCORD_WEBHOOK_URL, json=payload)
    except Exception:
        logger.warning("Discord 알림 전송 실패", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    now = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    await _post_discord({
        "embeds": [{
            "title": "✅ 서버 시작",
            "color": 0x57F287,
            "fields": [
                {"name": "🧩 서비스", "value": "logue", "inline": True},
                {"name": "⏰ 시간", "value": now, "inline": True},
            ],
        }]
    })
    logger.info("Startup Discord notification sent")
    yield


app = FastAPI(title="logue-ai", version="0.1.0", lifespan=lifespan)
app.include_router(anal_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled exception: %s %s — %s: %s",
        request.method,
        request.url.path,
        type(exc).__name__,
        exc,
        exc_info=True,
    )

    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    if len(tb) > 1800:
        tb = "...(truncated)\n" + tb[-1780:]

    await _post_discord({
        "embeds": [{
            "title": f":red_circle: Unhandled 500 — `{request.method} {request.url.path}`",
            "color": 0xED4245,
            "fields": [
                {"name": "Exception", "value": f"`{type(exc).__name__}: {exc}`", "inline": False},
                {"name": "Traceback", "value": f"```\n{tb}\n```", "inline": False},
            ],
        }]
    })
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


def check_upstream_health(url: str, timeout_sec: float) -> tuple[bool, int | None, str | None]:
    try:
        with urlopen(url, timeout=timeout_sec) as response:
            status_code = int(response.status)
            return (200 <= status_code < 300, status_code, None)
    except URLError as exc:
        return (False, None, str(exc))
    except Exception as exc:  # pragma: no cover
        return (False, None, str(exc))


@app.get("/health")
def health() -> dict[str, object]:
    logger.info("Health check requested")
    upstream_ok, upstream_status_code, upstream_error = check_upstream_health(
        UPSTREAM_HEALTH_URL,
        UPSTREAM_TIMEOUT_SEC,
    )

    status = "ok" if upstream_ok else "degraded"
    if upstream_ok:
        logger.info("Upstream health check succeeded: %s", UPSTREAM_HEALTH_URL)
    else:
        logger.warning(
            "Upstream health check failed: %s status_code=%s error=%s",
            UPSTREAM_HEALTH_URL,
            upstream_status_code,
            upstream_error,
        )

    return {
        "status": status,
        "upstream": {
            "url": UPSTREAM_HEALTH_URL,
            "ok": upstream_ok,
            "status_code": upstream_status_code,
            "error": upstream_error,
        },
    }


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting development server")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
