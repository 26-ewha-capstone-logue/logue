#!/usr/bin/env bash
set -euo pipefail

PART="${1:-}"
LLM_OUTPUT_FILE="${2:-}"
CURRENT_SHA="${3:-}"

if [[ -z "$PART" || -z "$LLM_OUTPUT_FILE" || -z "$CURRENT_SHA" ]]; then
  echo "usage: $0 <fe|be|ai> <llm_output_file> <current_sha>" >&2
  exit 2
fi

case "$PART" in
  fe|be|ai) ;;
  *) echo "error: PART must be fe|be|ai (got: $PART)" >&2; exit 2 ;;
esac

if [[ ! -s "$LLM_OUTPUT_FILE" ]]; then
  echo "error: LLM output file empty or missing: $LLM_OUTPUT_FILE" >&2
  exit 2
fi

REPO="${REFACTOR_SCAN_REPO:-26-ewha-capstone-logue/logue}"

case "$PART" in
  fe) ASSIGNEES="yeeeww" ;;
  be) ASSIGNEES="jxxxxxn,gyesswhat" ;;
  ai) ASSIGNEES="yeeeww,maetelson" ;;
esac

TODAY="$(date -u +%Y-%m-%d)"
TITLE="chore(${PART}): 리팩토링 백로그 스캔 ${TODAY}"
LABELS="🧹chore,🔨refactor,${PART},auto-generated,⏳status:todo"

BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT

{
  cat "$LLM_OUTPUT_FILE"
  printf '\n\n---\n'
  printf '<!-- last_sha: %s -->\n' "$CURRENT_SHA"
  printf '<!-- generated_by: refactor-scan workflow -->\n'
  printf '<!-- part: %s -->\n' "$PART"
} >"$BODY_FILE"

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "=== DRY RUN: would create issue ==="
  echo "repo:      $REPO"
  echo "title:     $TITLE"
  echo "labels:    $LABELS"
  echo "assignees: $ASSIGNEES"
  echo "--- body ---"
  cat "$BODY_FILE"
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI required" >&2
  exit 2
fi

gh issue create \
  --repo "$REPO" \
  --title "$TITLE" \
  --body-file "$BODY_FILE" \
  --label "$LABELS" \
  --assignee "$ASSIGNEES"
