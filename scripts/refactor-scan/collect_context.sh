#!/usr/bin/env bash
set -euo pipefail

PART="${1:-}"
LAST_SHA="${2:-}"

if [[ -z "$PART" ]]; then
  echo "usage: $0 <fe|be|ai> [LAST_SHA]" >&2
  exit 2
fi

case "$PART" in
  fe|be|ai) ;;
  *) echo "error: PART must be fe|be|ai (got: $PART)" >&2; exit 2 ;;
esac

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET_DIR="apps/$PART"

if [[ ! -d "$ROOT/$TARGET_DIR" ]]; then
  echo "error: $ROOT/$TARGET_DIR not found" >&2
  exit 2
fi

cd "$ROOT"

EXCLUDE_PATTERNS=(
  '*/node_modules/*'
  '*/.next/*'
  '*/build/*'
  '*/dist/*'
  '*/.gradle/*'
  '*/storybook-static/*'
  '*/coverage/*'
  '*/.venv/*'
  '*/__pycache__/*'
  '*/.pytest_cache/*'
  '*/.omc/*'
  '*/assets/*'
  '*yarn.lock'
  '*package-lock.json'
  '*pnpm-lock.yaml'
  '*uv.lock'
  '*.lock'
  '*.lockb'
  '*.png'
  '*.jpg'
  '*.jpeg'
  '*.gif'
  '*.svg'
  '*.webp'
  '*.ico'
  '*.pdf'
  '*.zip'
  '*.tar'
  '*.gz'
  '*.class'
  '*.jar'
)

should_include() {
  local f="$1"
  for pat in "${EXCLUDE_PATTERNS[@]}"; do
    case "$f" in
      $pat) return 1 ;;
    esac
  done
  return 0
}

resolve_diff_base() {
  if [[ -n "$LAST_SHA" ]] && git rev-parse --verify --quiet "$LAST_SHA^{commit}" >/dev/null; then
    echo "$LAST_SHA"
    return
  fi
  local sha
  sha="$(git log --since='30 days ago' --pretty=format:%H -- "$TARGET_DIR" | tail -1 || true)"
  if [[ -z "$sha" ]]; then
    sha="$(git log -n 50 --pretty=format:%H -- "$TARGET_DIR" | tail -1 || true)"
  fi
  echo "$sha"
}

BASE_SHA="$(resolve_diff_base)"
HEAD_SHA="$(git rev-parse HEAD)"

if [[ -n "$BASE_SHA" && "$BASE_SHA" != "$HEAD_SHA" ]]; then
  CHANGED_RAW="$(git diff --name-only "$BASE_SHA..HEAD" -- "$TARGET_DIR" || true)"
else
  CHANGED_RAW="$(git ls-files -- "$TARGET_DIR" || true)"
fi

FILE_CAP=80
LINE_CAP=300

filtered=()
total_seen=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ -f "$f" ]] || continue
  total_seen=$((total_seen + 1))
  if should_include "$f"; then
    filtered+=("$f")
  fi
done <<< "$CHANGED_RAW"

truncated_count=0
if [[ ${#filtered[@]} -gt $FILE_CAP ]]; then
  truncated_count=$((${#filtered[@]} - FILE_CAP))
  filtered=("${filtered[@]:0:$FILE_CAP}")
fi

printf '# 리팩토링 스캔 컨텍스트 — apps/%s\n\n' "$PART"
printf -- '- 기준 SHA: `%s`\n' "${BASE_SHA:-<none>}"
printf -- '- 현재 SHA: `%s`\n' "$HEAD_SHA"
printf -- '- 변경(또는 추적) 파일 수: %d (필터 적용 후 %d, 본문 포함 %d)\n' \
  "$total_seen" "$((${#filtered[@]} + truncated_count))" "${#filtered[@]}"
if [[ $truncated_count -gt 0 ]]; then
  printf -- '- 파일 본문 표시 상한 초과: %d개 생략됨\n' "$truncated_count"
fi
printf '\n## 디렉터리 트리 (apps/%s, depth 3)\n\n```\n' "$PART"
find "$TARGET_DIR" -maxdepth 3 \
  \( -path '*/node_modules' -o -path '*/.next' -o -path '*/build' \
     -o -path '*/dist' -o -path '*/.gradle' -o -path '*/.venv' \
     -o -path '*/__pycache__' -o -path '*/.pytest_cache' \
     -o -path '*/storybook-static' -o -path '*/coverage' -o -path '*/.omc' \) -prune -o \
  -print 2>/dev/null | sort | head -200
printf '```\n\n## 변경 파일 본문\n'

if [[ ${#filtered[@]} -eq 0 ]]; then
  printf '\n_(변경된 추적 파일 없음)_\n'
else
  for f in "${filtered[@]}"; do
    ext="${f##*.}"
    case "$ext" in
      ts|tsx|js|jsx) lang="ts" ;;
      java) lang="java" ;;
      py) lang="python" ;;
      json) lang="json" ;;
      md) lang="md" ;;
      yml|yaml) lang="yaml" ;;
      sh) lang="bash" ;;
      *) lang="" ;;
    esac
    line_count=$(wc -l <"$f" | tr -d ' ')
    printf '\n### `%s` (%s lines)\n\n```%s\n' "$f" "$line_count" "$lang"
    head -n "$LINE_CAP" "$f"
    if [[ "$line_count" -gt "$LINE_CAP" ]]; then
      printf '\n... (%d more lines truncated)\n' "$((line_count - LINE_CAP))"
    fi
    printf '```\n'
  done
fi
