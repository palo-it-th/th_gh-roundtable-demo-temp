#!/usr/bin/env bash
set -euo pipefail

# Run Vitest unit/integration tests
echo "Running Vitest unit tests..."
npx vitest run --reporter=verbose 2>&1
