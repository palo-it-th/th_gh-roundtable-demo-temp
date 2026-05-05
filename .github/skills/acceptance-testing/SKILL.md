---
name: acceptance-testing
description: Patterns for writing Playwright E2E tests that validate user story acceptance criteria, seed data sufficiency, and app-level behavior. Use when testing whether features satisfy requirements.
---

# Acceptance Testing Patterns

Patterns for validating features against user stories using Playwright E2E tests.

---

## Acceptance vs Unit vs E2E Testing

| Level | What it validates | Runs against |
|-------|-------------------|--------------|
| **Unit** | Individual functions/components work | Mocked dependencies |
| **Integration** | Modules work together | Real DB, mocked HTTP |
| **Acceptance** | Features satisfy user requirements | Full running app + browser |

**Acceptance tests answer:** "Does the user get what they asked for?" — not "Does the code work?"

---

## Deriving Tests from Acceptance Criteria

Every user story has acceptance criteria in the format:
> Given [context], When [action], Then [expected outcome]

Map each criterion to a Playwright test:

```typescript
// Story: STR-1 — View STR Cases
// AC: "Given I am an analyst, When I view the case list, Then I see cases filtered by my assignment"

test('analyst sees only assigned cases', async ({ page }) => {
  // Given: logged in as analyst
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'analyst@example.com');
  await page.fill('[data-testid="password"]', 'test123');
  await page.click('[data-testid="login-btn"]');

  // When: navigate to case list
  await page.goto('/cases');
  await page.waitForSelector('[data-testid="case-list"]');

  // Then: all visible cases are assigned to this analyst
  const cases = await page.$$eval('[data-testid="case-row"]', rows =>
    rows.map(r => r.getAttribute('data-analyst'))
  );
  expect(cases.every(a => a === 'analyst@example.com')).toBe(true);
});
```

### Pattern: One test per criterion

Do NOT bundle multiple criteria into one test. Each criterion = one focused test. This makes failure reports actionable.

---

## Seed Data Validation

Before running acceptance tests, validate that the database has enough variety:

### Check data variety

```sql
-- Ensure all enum values are represented
SELECT risk_level, COUNT(*) FROM "Case" GROUP BY risk_level;
SELECT status, COUNT(*) FROM "Case" GROUP BY status;
SELECT priority, COUNT(*) FROM "Case" GROUP BY priority;

-- Ensure relationships exist
SELECT COUNT(*) FROM "Case" WHERE assigned_analyst_id IS NOT NULL;
SELECT COUNT(*) FROM "Case" WHERE assigned_analyst_id IS NULL;
SELECT COUNT(DISTINCT assigned_analyst_id) FROM "Case";
```

### Minimum data requirements

For the AML/STR platform, acceptance tests typically need:
- At least 2 cases per `risk_level` (LOW, MEDIUM, HIGH, CRITICAL)
- At least 2 cases per `status` (OPEN, IN_REVIEW, ESCALATED, CLOSED)
- At least 3 analysts with cases assigned
- At least 1 unassigned case
- At least 1 case with attachments/notes

### Reporting gaps

When data is insufficient:
```markdown
## Seed Data Gaps
- Missing: Cases with risk_level = "CRITICAL" (needed for STR-1 risk filter test)
  - Current: 0 CRITICAL cases in database
  - Required: At least 2 for filter validation
  - Fix: Update prisma/seed.ts to include CRITICAL risk cases
```

---

## App Lifecycle Management

### Starting the app

```bash
# Start in background, capture PID
npm run dev > /tmp/app.log 2>&1 &
APP_PID=$!

# Wait for ready (try wait-on first, fall back to curl retry)
npx wait-on http://localhost:3000 --timeout 30000 2>/dev/null || \
  curl --retry 10 --retry-delay 2 --retry-connrefused http://localhost:3000 > /dev/null 2>&1

# Verify it's actually responding
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_STATUS" != "200" ] && [ "$HTTP_STATUS" != "307" ]; then
  echo "App returned $HTTP_STATUS — checking logs:"
  tail -20 /tmp/app.log
  exit 1
fi
```

### Stopping the app

```bash
kill $APP_PID 2>/dev/null || true
# Also kill any orphan next.js processes
lsof -ti:3000 | xargs kill 2>/dev/null || true
```

---

## Screenshot Capture

Always capture screenshots on failure:

```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('failure-screenshot', {
      body: screenshot,
      contentType: 'image/png'
    });
  }
});
```

For inline/quick tests without a test framework harness:

```bash
# Playwright screenshot from CLI
npx playwright screenshot http://localhost:3000/cases ./screenshots/cases-page.png
```

---

## Common Failure Patterns

| Symptom | Likely Cause | Fix Agent |
|---------|-------------|-----------|
| Page shows loading spinner indefinitely | API endpoint missing or erroring | backend-engineer |
| Empty list/table despite seed data | Frontend not calling correct API endpoint | frontend-engineer |
| Filter doesn't change results | Filter logic not implemented or query param ignored | Check API first (backend), then UI (frontend) |
| Form submits but nothing changes | API endpoint exists but doesn't persist | backend-engineer |
| Button/link not visible | Component not rendered or wrong route | frontend-engineer |
| 500 error on page load | Server-side error (check terminal output) | backend-engineer |
| Data shows but wrong format | Display logic or type mismatch | frontend-engineer |
| Seed data exists but not visible | Authorization/filtering too strict | backend-engineer |

---

## Playwright Configuration Tips

For acceptance testing in this project:

```typescript
// playwright.config.ts additions for acceptance tests
export default defineConfig({
  projects: [
    {
      name: 'acceptance',
      testDir: './tests/acceptance',
      use: {
        baseURL: 'http://localhost:3000',
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
```

---

## Quick Inline Test Pattern

When no existing test file covers a criterion, use Playwright's evaluate:

```bash
npx playwright test --project=chromium -e "
  const { test, expect } = require('@playwright/test');
  test('AC: filter by risk level', async ({ page }) => {
    await page.goto('/cases?risk=HIGH');
    const rows = await page.locator('[data-testid=case-row]').count();
    expect(rows).toBeGreaterThan(0);
  });
"
```

Or write to a temp file and run:

```bash
cat > /tmp/acceptance-test.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';
test('AC: filter by risk level shows results', async ({ page }) => {
  await page.goto('/cases?risk=HIGH');
  await page.waitForSelector('[data-testid="case-list"]');
  const count = await page.locator('[data-testid="case-row"]').count();
  expect(count).toBeGreaterThan(0);
});
EOF
npx playwright test /tmp/acceptance-test.spec.ts --reporter=list
```
