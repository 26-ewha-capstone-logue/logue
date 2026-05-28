#!/usr/bin/env bash
# 파일 분석 API (POST /v1/llm/data-sources/analyze) smoke 테스트.
# payloads/*.json 을 순서대로 호출해 응답·HTTP 코드를 출력한다.
# 사용법은 README.md 참조. 실제 OpenAI 호출이므로 비용 발생.

set -euo pipefail

HOST="${SMOKE_HOST:-http://localhost:8000}"
ENDPOINT="${HOST}/v1/llm/data-sources/analyze"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PAYLOAD_DIR="${SCRIPT_DIR}/payloads"
TMP_BODY="$(mktemp -t fa_smoke_body.XXXXXX.json)"
trap 'rm -f "${TMP_BODY}"' EXIT

if ! ls "${PAYLOAD_DIR}"/*.json >/dev/null 2>&1; then
  echo "❌ payloads/*.json 이 비어 있습니다 (${PAYLOAD_DIR})" >&2
  exit 1
fi

for payload in "${PAYLOAD_DIR}"/*.json; do
  name="$(basename "${payload}" .json)"
  echo "============================================================"
  echo "▶  ${name}"
  echo "   payload: ${payload}"
  echo "============================================================"

  code=$(curl -s -o "${TMP_BODY}" -w '%{http_code}' \
    -X POST "${ENDPOINT}" \
    -H 'Content-Type: application/json' \
    --data @"${payload}")

  echo "HTTP ${code}"
  if command -v python3 >/dev/null 2>&1; then
    python3 -m json.tool < "${TMP_BODY}" || cat "${TMP_BODY}"
  else
    cat "${TMP_BODY}"
  fi
  echo
done
