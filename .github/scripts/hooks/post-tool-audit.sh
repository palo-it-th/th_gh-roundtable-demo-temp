#!/usr/bin/env bash
set -euo pipefail

# post-tool-audit.sh — Log every tool action for compliance
# Handles both VS Code (snake_case) and CLI (camelCase) input formats:
#   VS Code: { "timestamp", "cwd", "tool_name", "tool_input", "tool_response" }
#   CLI:     { "timestamp", "cwd", "toolName",  "toolArgs",   "toolResult" }

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null || echo ".")
WORK_DIR="${CWD:-.}"
mkdir -p "${WORK_DIR}/logs"

# Use jq to construct output JSON — normalise field names from either format
echo "$INPUT" | jq -c '{
  timestamp: (if (.timestamp | type) == "number" then (.timestamp / 1000 | strftime("%Y-%m-%dT%H:%M:%SZ")) elif .timestamp then (.timestamp | tostring) else "" end),
  event: "tool_use",
  tool: (.toolName // .tool_name // "unknown"),
  args_summary: ((.toolArgs // .tool_input // {}) | to_entries | map(.key + ":" + (.value | tostring | .[0:60])) | join(", ") | .[0:200])
}' >> "${WORK_DIR}/logs/audit.jsonl" 2>/dev/null

# When the tool is "task", also emit an agent_dispatch event for pipeline visibility
TOOL_NAME=$(echo "$INPUT" | jq -r '.toolName // .tool_name // ""' 2>/dev/null || echo "")
if [[ "$TOOL_NAME" == "task" ]]; then
  TOOL_ARGS=$(echo "$INPUT" | jq -c '.toolArgs // .tool_input // {}' 2>/dev/null || echo "{}")
  echo "$TOOL_ARGS" | jq -c --arg ts "$(echo "$INPUT" | jq -r 'if (.timestamp | type) == "number" then (.timestamp / 1000 | strftime("%Y-%m-%dT%H:%M:%SZ")) elif .timestamp then (.timestamp | tostring) else "" end' 2>/dev/null)" '{
    timestamp: $ts,
    event: "agent_dispatch",
    agent_type: (.agent_type // "unknown"),
    agent_name: (.name // "unnamed"),
    description: (.description // ""),
    mode: (.mode // "sync")
  }' >> "${WORK_DIR}/logs/audit.jsonl" 2>/dev/null
fi

echo '{"logged":true}'
