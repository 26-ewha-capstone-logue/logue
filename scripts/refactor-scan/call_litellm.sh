#!/usr/bin/env bash
set -euo pipefail

: "${LITELLM_BASE_URL:?LITELLM_BASE_URL required}"
: "${LITELLM_MODEL:?LITELLM_MODEL required}"
LITELLM_MAX_TOKENS="${LITELLM_MAX_TOKENS:-2048}"

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq required" >&2
  exit 2
fi

prompt="$(cat)"
if [[ -z "$prompt" ]]; then
  echo "error: empty prompt on stdin" >&2
  exit 2
fi

payload="$(
  jq -n \
    --arg model "$LITELLM_MODEL" \
    --arg content "$prompt" \
    --argjson max_tokens "$LITELLM_MAX_TOKENS" \
    '{
      model: $model,
      max_tokens: $max_tokens,
      temperature: 0.2,
      messages: [{role: "user", content: $content}]
    }'
)"

endpoint="${LITELLM_BASE_URL%/}/v1/chat/completions"

keys=()
for slot in 1 2 3; do
  varname="LITELLM_API_KEY_$slot"
  val="${!varname:-}"
  if [[ -n "$val" ]]; then
    keys+=("$val")
  fi
done

if [[ ${#keys[@]} -eq 0 ]]; then
  echo "error: no LITELLM_API_KEY_{1,2,3} set" >&2
  exit 2
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
body_file="$tmpdir/body"
status_file="$tmpdir/status"

call_once() {
  local key="$1"
  : >"$body_file"
  : >"$status_file"
  local http_status curl_exit
  set +e
  http_status="$(
    curl --silent --show-error --location \
      --max-time 120 \
      --output "$body_file" \
      --write-out '%{http_code}' \
      --header "Authorization: Bearer $key" \
      --header 'Content-Type: application/json' \
      --data "$payload" \
      "$endpoint" 2>"$tmpdir/curl_err"
  )"
  curl_exit=$?
  set -e
  if [[ $curl_exit -ne 0 ]]; then
    http_status="000"
  fi
  echo "$http_status" >"$status_file"
}

snippet_of_body() {
  if [[ -s "$body_file" ]]; then
    head -c 400 "$body_file" | tr '\n' ' '
  else
    echo "<empty body>"
  fi
}

slot_label=0
last_status=""
for key in "${keys[@]}"; do
  slot_label=$((slot_label + 1))
  for attempt in 1 2; do
    call_once "$key"
    status="$(cat "$status_file")"
    last_status="$status"

    if [[ "$status" == "200" ]]; then
      content="$(jq -er '.choices[0].message.content // empty' <"$body_file" 2>/dev/null || true)"
      if [[ -n "$content" ]]; then
        printf '%s' "$content"
        exit 0
      fi
      echo "warn: slot=$slot_label attempt=$attempt empty content, falling back" >&2
      break
    fi

    case "$status" in
      5*)
        echo "warn: slot=$slot_label attempt=$attempt 5xx ($status), retrying once" >&2
        [[ "$attempt" == "1" ]] && sleep 2 && continue
        break
        ;;
      4*)
        echo "warn: slot=$slot_label attempt=$attempt 4xx ($status), switching slot" >&2
        break
        ;;
      *)
        echo "warn: slot=$slot_label attempt=$attempt status=$status, switching slot" >&2
        break
        ;;
    esac
  done
done

{
  echo "error: all $slot_label LiteLLM key slot(s) exhausted (last status=$last_status)"
  echo "last body snippet: $(snippet_of_body)"
} >&2
exit 1
