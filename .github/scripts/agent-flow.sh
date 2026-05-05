#!/usr/bin/env bash
set -uo pipefail

# agent-flow.sh — Analyse audit log to show agent pipeline flow
# Usage: .github/scripts/agent-flow.sh [logs/audit.jsonl]

AUDIT_LOG="${1:-logs/audit.jsonl}"

if [[ ! -f "$AUDIT_LOG" ]]; then
  echo "Error: audit log not found at $AUDIT_LOG" >&2
  exit 1
fi

echo "═══════════════════════════════════════════════════════════"
echo "  Agent Pipeline Flow Report"
echo "═══════════════════════════════════════════════════════════"
echo ""

TOTAL_LINES=$(wc -l < "$AUDIT_LOG" | tr -d ' ')
VALID_LINES=$(jq -Rr 'fromjson? // empty | "x"' "$AUDIT_LOG" 2>/dev/null | wc -l | tr -d ' ')
echo "  Log: $AUDIT_LOG ($TOTAL_LINES lines, $VALID_LINES parseable)"
echo ""

# Session timeline
echo "▸ Sessions"
jq -Rr 'fromjson? // empty | select(.event == "session_start" or .event == "session_end") |
  "  " + (.timestamp | tostring) + "  " + .event +
  (if .source then " (" + .source + ")" else "" end) +
  (if .reason then " reason=" + .reason else "" end)' "$AUDIT_LOG" 2>/dev/null || true
echo ""

# Agent completions (the core flow — VS Code only fires SubagentStop, not dispatch)
echo "▸ Agent Timeline"
jq -Rr 'fromjson? // empty | select(.event == "agent_complete") |
  "  " + (.timestamp | tostring) + "  ◼ COMPLETE  " + .agent +
  (if .stop_reason != null and .stop_reason != "" and .stop_reason != "completed" then " → " + .stop_reason else "" end)' "$AUDIT_LOG" 2>/dev/null || true
echo ""

# Agent usage summary (derived from agent_complete events)
echo "▸ Agent Summary"
echo "  Agents invoked:"
AGENTS_USED=$(jq -Rr 'fromjson? // empty | select(.event == "agent_complete") | .agent' "$AUDIT_LOG" 2>/dev/null || true)
if [[ -n "$AGENTS_USED" ]]; then
  echo "$AGENTS_USED" | sort | uniq -c | sort -rn | while read -r count agent; do
    printf "    %-25s %s invocations\n" "$agent" "$count"
  done
else
  echo "    (none)"
fi

ALL_AGENTS="acceptance-tester architect backend-engineer code-simplifier frontend-engineer human-gateway orchestrator security-advisor test-runner ui-designer ui-reviewer"

echo ""
echo "  Never invoked:"
FOUND_MISSING=false
UNIQUE_AGENTS=$(echo "$AGENTS_USED" | sort -u)
for agent in $ALL_AGENTS; do
  if ! echo "$UNIQUE_AGENTS" | grep -qx "$agent" 2>/dev/null; then
    printf "    ⚠  %s\n" "$agent"
    FOUND_MISSING=true
  fi
done
$FOUND_MISSING || echo "    (all agents used ✓)"

echo ""

# Tool usage by type (top 10)
echo "▸ Tool Usage (top 10)"
jq -Rr 'fromjson? // empty | select(.event == "tool_use") | .tool' "$AUDIT_LOG" 2>/dev/null | sort | uniq -c | sort -rn | head -10 | while read -r count tool; do
  printf "    %-25s %s calls\n" "$tool" "$count"
done

echo ""
echo "═══════════════════════════════════════════════════════════"
