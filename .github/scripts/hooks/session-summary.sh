#!/usr/bin/env bash
set -euo pipefail

# session-summary.sh — Persist state on session end
# Input (stdin): { "timestamp", "cwd", "reason" }

INPUT=$(cat)
TIMESTAMP=$(echo "$INPUT" | jq -r '.timestamp // empty' 2>/dev/null || echo "")
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null || echo ".")
REASON=$(echo "$INPUT" | jq -r '.reason // "unknown"' 2>/dev/null || echo "unknown")

WORK_DIR="${CWD:-.}"
mkdir -p "${WORK_DIR}/logs"

AUDIT_LOG="${WORK_DIR}/logs/audit.jsonl"
TOOL_COUNT=$(grep -c 'tool_use' "$AUDIT_LOG" 2>/dev/null || echo "0")

echo "{\"timestamp\":\"${TIMESTAMP}\",\"event\":\"session_end\",\"reason\":\"${REASON}\",\"tool_uses\":${TOOL_COUNT}}" >> "$AUDIT_LOG"

SESSION_STATE="${WORK_DIR}/docs/backlog/session-state.md"
if [[ -f "$SESSION_STATE" ]]; then
  echo -e "\n---\n**Session ended:** ${TIMESTAMP} | **Reason:** ${REASON} | **Tool uses:** ${TOOL_COUNT}" >> "$SESSION_STATE"
fi

echo "{\"session_ended\":true,\"tool_uses\":${TOOL_COUNT}}"
