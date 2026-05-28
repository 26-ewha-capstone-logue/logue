#!/usr/bin/env bash
# 파일 분석 API (POST /v1/llm/data-sources/analyze) smoke 테스트.
# payloads/*.json 을 순서대로 호출해 응답·HTTP 코드를 출력하고
# results/<timestamp>/ 아래에 응답·마스킹된 요청·SUMMARY.md 를 저장한다.
# 사용법은 README.md 참조. 실제 OpenAI 호출이므로 비용 발생.

set -euo pipefail

HOST="${SMOKE_HOST:-http://localhost:8000}"
ENDPOINT="${HOST}/v1/llm/data-sources/analyze"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PAYLOAD_DIR="${SCRIPT_DIR}/payloads"
RUN_ID="$(date +%Y%m%d-%H%M%S)"
RESULTS_DIR="${SCRIPT_DIR}/results/${RUN_ID}"

if ! ls "${PAYLOAD_DIR}"/*.json >/dev/null 2>&1; then
  echo "❌ payloads/*.json 이 비어 있습니다 (${PAYLOAD_DIR})" >&2
  exit 1
fi

mkdir -p "${RESULTS_DIR}"

for payload in "${PAYLOAD_DIR}"/*.json; do
  name="$(basename "${payload}" .json)"
  echo "============================================================"
  echo "▶  ${name}"
  echo "   payload: ${payload}"
  echo "============================================================"

  # 요청 페이로드 스냅샷 (이후 summarize.py 가 마스킹 후 원본 삭제)
  cp "${payload}" "${RESULTS_DIR}/${name}.request.json"

  response_path="${RESULTS_DIR}/${name}.response.json"
  code=$(curl -s -o "${response_path}" -w '%{http_code}' \
    -X POST "${ENDPOINT}" \
    -H 'Content-Type: application/json' \
    --data @"${payload}")

  printf '{"name": "%s", "http": "%s"}\n' "${name}" "${code}" \
    > "${RESULTS_DIR}/${name}.meta.json"

  echo "HTTP ${code}"
  if command -v python3 >/dev/null 2>&1; then
    python3 -m json.tool < "${response_path}" || cat "${response_path}"
  else
    cat "${response_path}"
  fi
  echo
done

echo "============================================================"
echo "▶  SUMMARY.md 생성 + 요청 페이로드 마스킹"
echo "============================================================"
python3 "${SCRIPT_DIR}/summarize.py" "${RESULTS_DIR}"
echo "   결과 디렉토리: ${RESULTS_DIR}"
