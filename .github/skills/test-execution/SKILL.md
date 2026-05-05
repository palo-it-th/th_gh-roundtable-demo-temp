---
name: test-execution
description: How to run unit tests and end-to-end tests, interpret results, and write new tests. Use when running tests or writing test code.
---

# Test Execution Guide

Guide for running unit tests and end-to-end tests, interpreting results, and writing new tests.

---

## Testing Hierarchy

| Level | Purpose | Validates |
|-------|---------|-----------|
| **Unit/Integration** | Code correctness | Functions, components, API routes work |
| **Acceptance (E2E)** | Requirement satisfaction | Features satisfy user story criteria |

Unit/integration testing answers: "Does the code work?"
Acceptance testing answers: "Does the user get what they asked for?"

These are complementary — both must pass. See the `acceptance-testing` skill for acceptance-level patterns.

---

## Prerequisites (Build-First Protocol)

**Tests are meaningless if the project doesn't compile.** Before executing any test command:

1. Ensure the dev environment is ready — follow the `dev-environment` skill steps (database, deps, Prisma)
2. Verify the build compiles:

```bash
npx tsc --noEmit
```

**If this fails:** Do not proceed to tests. The TypeScript errors must be fixed first. Report the compilation errors to the orchestrator or fix them yourself if you have edit access.

---

## Running Tests

> **Note:** The examples below use Vitest and Playwright. Adapt commands to your project's test runner.

### Unit & Integration Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (development)
npm run test:watch

# Run specific test file
npx vitest run src/services/pricing.test.ts

# Run tests matching a pattern
npx vitest run --reporter=verbose -t "should calculate total price"

# Run with coverage
npx vitest run --coverage
```

### End-to-End Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/order-management.spec.ts

# Run with UI mode (debug)
npx playwright test --ui

# Run headed (visible browser)
npx playwright test --headed
```

### Interpreting Results

**Vitest output:**
- ✓ = passed, × = failed, ○ = skipped
- Look for `FAIL` lines first, then read the assertion diff
- `expected` vs `received` shows exactly what diverged

**Playwright output:**
- Each test shows browser + file + test name
- Failures include screenshot path and trace file
- Run `npx playwright show-report` for HTML report with screenshots

---

## Writing New Tests

### Acceptance Criteria → Test

For each acceptance criterion in a user story, write at least one test:

```typescript
// AC: "Given a pending order, When approved, Then status is APPROVED"
test('should approve a pending order', async () => {
  const order = await createTestOrder({ status: 'PENDING' });
  const result = await approveOrder(order.id, { reason: 'Verified' });
  expect(result.status).toBe('APPROVED');
});
```

### Test File Naming

- Unit tests: `*.test.ts` colocated with source
- Integration tests: `*.test.ts` in `tests/integration/`
- E2E tests: `*.spec.ts` in `tests/e2e/`

### Selector Strategy (E2E, Priority Order)

1. **`data-testid`** — most reliable, decoupled from UI changes
2. **Role-based** — `getByRole('button', { name: '...' })`
3. **Text-based** — `getByText('...')`
4. **CSS selectors** — last resort only

### Key Anti-Patterns to Avoid

- ❌ `await page.waitForTimeout(2000)` — use auto-waiting or `waitForResponse`
- ❌ Testing internal state — test observable behaviour
- ❌ Mega-tests covering multiple flows — one focused assertion per test
- ❌ Order-dependent tests — each test sets up its own state
- ❌ Snapshot abuse on UI components — too brittle
