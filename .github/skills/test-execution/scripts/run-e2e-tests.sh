#!/usr/bin/env bash
set -euo pipefail

# Run Playwright E2E tests
echo "Running Playwright E2E tests..."
npx playwright test --reporter=list 2>&1
