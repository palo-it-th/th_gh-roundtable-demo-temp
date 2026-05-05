#!/usr/bin/env bash
set -euo pipefail

# security-check.sh — Block dangerous operations
# Handles both VS Code (snake_case) and CLI (camelCase) input:
#   VS Code: { "tool_name", "tool_input" }
#   CLI:     { "toolName",  "toolArgs" }
# Output: { "permissionDecision": "allow"|"deny", "permissionDecisionReason": "..." }

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.toolName // .tool_name // empty' 2>/dev/null || echo "")
TOOL_ARGS=$(echo "$INPUT" | jq -c '.toolArgs // .tool_input // {}' 2>/dev/null || echo "{}")

deny() {
  echo "{\"permissionDecision\":\"deny\",\"permissionDecisionReason\":\"$1\"}"
  exit 0
}

# Check dangerous bash commands
if [[ "$TOOL_NAME" == "bash" || "$TOOL_NAME" == "shell" || "$TOOL_NAME" == "terminal" || "$TOOL_NAME" == "run_in_terminal" ]]; then
  CMD=$(echo "$TOOL_ARGS" | jq -r '.command // .cmd // .input // empty' 2>/dev/null || echo "")
  CMD_LOWER=$(echo "$CMD" | tr '[:upper:]' '[:lower:]')

  echo "$CMD_LOWER" | grep -qE 'rm\s+(-[a-z]*)?r[a-z]*f' && deny "Blocked: rm -rf is not permitted"
  echo "$CMD_LOWER" | grep -qiE 'drop\s+table' && deny "Blocked: DROP TABLE is not permitted"
  echo "$CMD_LOWER" | grep -qE '(^|[;&|]\s*)sudo\s' && deny "Blocked: sudo is not permitted"
  echo "$CMD_LOWER" | grep -qE '(^|[;&|]\s*)mkfs' && deny "Blocked: mkfs is not permitted"
  echo "$CMD_LOWER" | grep -qE 'chmod\s+777' && deny "Blocked: chmod 777 is not permitted"
  echo "$CMD_LOWER" | grep -qE '(^|[;&|]\s*)dd\s+' && deny "Blocked: dd is not permitted"
fi

# Check protected file edits (VS Code uses different tool names)
if [[ "$TOOL_NAME" == "edit" || "$TOOL_NAME" == "create" || "$TOOL_NAME" == "write" || "$TOOL_NAME" == "replace_string_in_file" || "$TOOL_NAME" == "multi_replace_string_in_file" || "$TOOL_NAME" == "insert_text_in_file" || "$TOOL_NAME" == "create_file" ]]; then
  FILE_PATH=$(echo "$TOOL_ARGS" | jq -r '.path // .file // .filePath // (.replacements[0].filePath // empty)' 2>/dev/null || echo "")

  echo "$FILE_PATH" | grep -qE '(^|/)\.env($|\.)' && deny "Blocked: cannot modify .env files"
  echo "$FILE_PATH" | grep -qE '(^|/)secrets/' && deny "Blocked: cannot modify secrets/"
  echo "$FILE_PATH" | grep -qE '\.(pem|key)$' && deny "Blocked: cannot modify key files"
  echo "$FILE_PATH" | grep -qE '(^|/)\.github/scripts/hooks/' && deny "Blocked: cannot modify hook scripts"
  echo "$FILE_PATH" | grep -qE '(^|/)\.github/hooks/' && deny "Blocked: cannot modify hook config"
fi

echo '{"permissionDecision":"allow"}'
