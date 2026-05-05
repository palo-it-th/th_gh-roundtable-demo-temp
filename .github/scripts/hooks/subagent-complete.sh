#!/usr/bin/env bash
set -euo pipefail

# subagent-complete.sh — Log subagent completion for pipeline tracking
# VS Code SubagentStop payload (confirmed from runtime):
#   { "timestamp", "hook_event_name", "session_id", "transcript_path",
#     "agent_id", "agent_type", "stop_hook_active", "cwd" }

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null || echo ".")
WORK_DIR="${CWD:-.}"
mkdir -p "${WORK_DIR}/logs"

# Use jq to construct output JSON — agent name is in .agent_type
echo "$INPUT" | jq -c '{
  timestamp: (if (.timestamp | type) == "number" then (.timestamp / 1000 | strftime("%Y-%m-%dT%H:%M:%SZ")) elif .timestamp then (.timestamp | tostring) else "" end),
  event: "agent_complete",
  agent: (.agent_type // .agentName // .agent_name // "unknown"),
  session_id: (.session_id // .sessionId // ""),
  stop_reason: (.stopReason // .stop_reason // "completed")
}' >> "${WORK_DIR}/logs/audit.jsonl" 2>/dev/null

AGENT=$(echo "$INPUT" | jq -r '.agent_type // .agentName // .agent_name // "unknown"' 2>/dev/null || echo "unknown")
echo "{\"logged\":true,\"agent\":\"${AGENT}\"}"
