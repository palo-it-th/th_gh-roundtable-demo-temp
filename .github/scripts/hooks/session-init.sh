#!/usr/bin/env bash
set -euo pipefail

# session-init.sh — Recovery & Initialization
# Handles both VS Code (snake_case) and CLI (camelCase) input

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null || echo ".")
SOURCE=$(echo "$INPUT" | jq -r '.source // empty' 2>/dev/null || echo "")

WORK_DIR="${CWD:-.}"
mkdir -p "${WORK_DIR}/logs"

AUDIT_LOG="${WORK_DIR}/logs/audit.jsonl"
[[ ! -f "$AUDIT_LOG" ]] && touch "$AUDIT_LOG"

SESSION_STATE="${WORK_DIR}/docs/backlog/session-state.md"
RESUMED="false"

if [[ "$SOURCE" == "resume" ]] && [[ -f "$SESSION_STATE" ]]; then
  RESUMED="true"
fi

echo "$INPUT" | jq -c --argjson resumed "$RESUMED" '{
  timestamp: (if (.timestamp | type) == "number" then (.timestamp / 1000 | strftime("%Y-%m-%dT%H:%M:%SZ")) elif .timestamp then (.timestamp | tostring) else "" end),
  event: "session_start",
  source: (.source // "unknown"),
  resumed: $resumed
}' >> "$AUDIT_LOG" 2>/dev/null

STATE_EXISTS="false"
[[ -f "$SESSION_STATE" ]] && STATE_EXISTS="true"
echo "{\"initialized\":true,\"resumed\":${RESUMED},\"session_state_exists\":${STATE_EXISTS}}"
