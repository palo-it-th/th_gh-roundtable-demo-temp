#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCES_FILE="$SCRIPT_DIR/sources.json"
HASH_STORE="$SCRIPT_DIR/hashes.json"

if [ ! -f "$HASH_STORE" ]; then
  echo "{}" > "$HASH_STORE"
fi

CHANGES_DETECTED=()
CHANGE_DETAILS=""

source_count=$(jq '.sources | length' "$SOURCES_FILE")

for i in $(seq 0 $((source_count - 1))); do
  id=$(jq -r ".sources[$i].id" "$SOURCES_FILE")
  url=$(jq -r ".sources[$i].url" "$SOURCES_FILE")
  name=$(jq -r ".sources[$i].name" "$SOURCES_FILE")
  relevance=$(jq -r ".sources[$i].relevance" "$SOURCES_FILE")
  update_scope=$(jq -r ".sources[$i].update_scope | join(\", \")" "$SOURCES_FILE")
  timeout=$(jq -r ".settings.timeout_seconds" "$SOURCES_FILE")

  echo "::group::Checking: $name"
  echo "  URL: $url"

  content=""
  http_code=""
  for attempt in 1 2 3; do
    http_code=$(curl -sL --max-time "$timeout" -o /tmp/resource_content -w "%{http_code}" "$url" 2>/dev/null) || true
    if [ "$http_code" = "200" ]; then
      content=$(cat /tmp/resource_content)
      break
    fi
    echo "  Attempt $attempt: HTTP $http_code, retrying..."
    sleep 5
  done

  if [ -z "$content" ]; then
    echo "  WARNING: Failed to fetch $url (HTTP $http_code) after 3 attempts — skipping"
    echo "::endgroup::"
    continue
  fi

  new_hash=$(echo "$content" | sha256sum | awk '{print $1}')
  old_hash=$(jq -r ".[\"$id\"] // \"\"" "$HASH_STORE")

  if [ "$old_hash" = "" ]; then
    echo "  First check — storing baseline hash: ${new_hash:0:12}..."
    jq --arg id "$id" --arg hash "$new_hash" '. + {($id): $hash}' "$HASH_STORE" > "$HASH_STORE.tmp"
    mv "$HASH_STORE.tmp" "$HASH_STORE"
  elif [ "$old_hash" != "$new_hash" ]; then
    echo "  CHANGE DETECTED!"
    echo "  Old hash: ${old_hash:0:12}..."
    echo "  New hash: ${new_hash:0:12}..."
    CHANGES_DETECTED+=("$id")
    CHANGE_DETAILS="${CHANGE_DETAILS}
---
Source: ${name}
ID: ${id}
URL: ${url}
Relevance: ${relevance}
Files to update: ${update_scope}
"
    jq --arg id "$id" --arg hash "$new_hash" '. + {($id): $hash}' "$HASH_STORE" > "$HASH_STORE.tmp"
    mv "$HASH_STORE.tmp" "$HASH_STORE"
  else
    echo "  No change (hash: ${new_hash:0:12}...)"
  fi

  echo "::endgroup::"
done

if [ ${#CHANGES_DETECTED[@]} -gt 0 ]; then
  echo ""
  echo "=== CHANGES SUMMARY ==="
  echo "Changed sources: ${CHANGES_DETECTED[*]}"
  echo "$CHANGE_DETAILS"

  {
    echo "changes_detected=true"
    echo "changed_sources=${CHANGES_DETECTED[*]}"
  } >> "$GITHUB_OUTPUT"

  delimiter="$(openssl rand -hex 16)"
  {
    echo "change_details<<${delimiter}"
    echo "$CHANGE_DETAILS"
    echo "${delimiter}"
  } >> "$GITHUB_OUTPUT"
else
  echo ""
  echo "=== NO CHANGES DETECTED ==="
  echo "changes_detected=false" >> "$GITHUB_OUTPUT"
fi
