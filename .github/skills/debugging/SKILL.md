---
name: debugging
description: How to diagnose test failures, read stack traces, identify root causes, apply targeted fixes, and retry. Includes retry limits and escalation rules. Use when tests fail or errors occur.
---

# Debugging Guide

Guide for diagnosing and fixing failures — reading stack traces, identifying root causes, applying targeted fixes, and knowing when to escalate.

---

<!-- Enhanced with patterns from garrytan / investigate -->
## Investigation-First Protocol

**CRITICAL RULE: NEVER attempt a fix without investigation first.**

When a test fails or an error occurs, follow this protocol strictly:

### Step 1: Read the Error Carefully

- Read the ENTIRE error message, not just the first line
- Identify the error type (assertion failure, runtime error, timeout, network error)
- Note the file, line number, and function name
- Look at the "expected vs received" diff (if assertion)

### Step 2: Trace the Data Flow

- Start at the point of failure and trace backwards
- What function produced the incorrect value?
- What inputs did that function receive?
- Where did those inputs come from?

### Step 3: Form Hypotheses

Write down 2-3 possible causes before looking at code:
1. "The input data might be in the wrong format"
2. "The database query might be missing a WHERE clause"
3. "The async operation might not be awaited"

### Step 4: Test Hypotheses

For each hypothesis, find evidence:
- Read the relevant source code
- Add targeted `console.log` or use debugger
- Check recent changes to the affected files (`git log -p --follow <file>`)
- Look for similar patterns that DO work

### Step 5: Apply Targeted Fix

Only after you understand WHY the failure occurs:
- Fix the root cause, not the symptom
- Verify the fix doesn't break other tests
- Remove any debug logging added during investigation

### The Rubber Duck Principle

Before writing a fix, explain the bug in plain English:
> "The test fails because `calculateTotalPrice` returns `undefined` when `discountPercent` is 0. This happens because line 45 has `if (discountPercent)` which is falsy for 0. The fix is to use `if (discountPercent !== undefined)`."

If you can't explain it clearly, you haven't investigated enough.

---

## Stack Trace Reading

### Unit Test Stack Traces

```
FAIL  src/services/pricing.test.ts > Pricing > should calculate price with discount
AssertionError: expected 0 to be 90

  ❯ src/services/pricing.test.ts:42:28
     40|     const result = calculateTotalPrice(discountedOrder);
     41|
     42|     expect(result.total).toBe(90);
       |                          ^
     43|   });
```

**Reading this:**
1. Test file: `pricing.test.ts`, line 42
2. Expected `90`, got `0`
3. The function `calculateTotalPrice` returned an object with `total: 0`
4. **Next step:** Look at `calculateTotalPrice` implementation — why does it return 0 for a discounted order?

### E2E Test Stack Traces

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: getByTestId('status-badge-active')
  at tests/e2e/order-detail.spec.ts:28:5
```

**Reading this:**
1. Element with `data-testid="status-badge-active"` never appeared
2. Timeout: 5000ms (default)
3. **Next steps:** Is the element rendered? Is the testid correct? Is the data loaded?

### ORM/Database Error Patterns

<!-- Enhanced with patterns from common ORM error codes -->

| Pattern | Meaning | Common Cause |
|---------|---------|-------------|
| Unique constraint violation | Duplicate value on unique column | Duplicate insert |
| Foreign key constraint failure | Referenced record missing | Referenced record doesn't exist |
| Record not found | Query returned no results | Wrong ID or deleted record |
| Connection failure | Cannot reach database server | Connection string or DB is down |
| Table/relation not found | Queried table does not exist | Migration not run |

---

## Root Cause Analysis Checklist

Work through these categories when investigating:

### Data Issues
- [ ] Is test data set up correctly? (missing seed, wrong fixture)
- [ ] Are IDs referencing the correct records?
- [ ] Is the database in expected state? (check migrations ran)
- [ ] Are timestamps/dates in the expected timezone?

### Async Issues
- [ ] Is a Promise being awaited?
- [ ] Is a response being waited for before assertions?
- [ ] Is there a race condition between parallel operations?
- [ ] Are event handlers registered before the triggering action?

### Environment Issues
- [ ] Are environment variables set correctly?
- [ ] Is the dev server running (for E2E)?
- [ ] Are ports available (dev server port, database port)?
- [ ] Is the database accessible and migrated?

### Type Issues
- [ ] Is a value `undefined` vs `null` vs empty string?
- [ ] Is a number being compared to a string?
- [ ] Is an object reference vs value comparison?
- [ ] Are optional fields handled with proper defaults?

### Import/Module Issues
- [ ] Are imports resolving correctly (`@/` aliases)?
- [ ] Is a module being imported from the right path?
- [ ] Are barrel exports causing circular dependencies?
- [ ] Is a mock overriding the correct module?

---

## Retry Limits & Escalation

### Retry Policy

| Attempt | Action |
|---------|--------|
| 1st failure | Investigate using the protocol above. Apply fix. |
| 2nd failure | Re-read the error. Check if your fix addressed the right thing. Look for a different root cause. |
| 3rd failure | **STOP.** Escalate to the orchestrator/human with your investigation notes. |

### Escalation Report Format

When escalating after 3 failed attempts, provide:

```markdown
## Escalation: [Test Name / Error]

### Error
[Full error message]

### Investigation Done
1. [What you checked and found]
2. [Second hypothesis tested]
3. [Third hypothesis tested]

### Fixes Attempted
1. [Fix 1 — why it didn't work]
2. [Fix 2 — why it didn't work]

### Current Hypothesis
[What you think the root cause is, even if you can't fix it]

### Suggested Next Steps
[What a human should look at]
```

---

## Common Failure Patterns

### Web Framework

<!-- Enhanced with patterns from common web framework issues -->

| Pattern | Cause | Fix |
|---------|-------|-----|
| `headers()` called in non-async context | Missing `async` on route handler | Add `async` to the function |
| `cookies()` returns empty | Cookie setup missing in tests | Mock cookies in test setup |
| Dynamic route params undefined | Route params not parsed correctly | Ensure params are awaited/parsed before use |
| Server-rendered component shows no data | Data fetch failed silently | Add error boundary, check fetch |

### ORM / Database

<!-- Enhanced with patterns from common ORM issues -->

| Pattern | Cause | Fix |
|---------|-------|-----|
| ORM initialization error | DB not running or wrong URL | Check database connection URL env var |
| Relation not loaded | Missing eager loading on query | Add relation loading to the query |
| Enum value rejected | Schema not migrated | Run pending migrations |
| Test isolation failure | Shared DB state between tests | Use transaction rollback or truncate |

### Unit Tests

<!-- Enhanced with patterns from common unit test issues -->

| Pattern | Cause | Fix |
|---------|-------|-----|
| Module not found (`@/...`) | Missing path alias in test config | Add `resolve.alias` config |
| Mock not working | Wrong module path in mock function | Use exact import path |
| Timeout on async test | Missing `await` or long operation | Add await or increase timeout |
| State leaking between tests | Shared mutable state | Reset in `beforeEach` |

### E2E Tests

<!-- Enhanced with patterns from common E2E test issues -->

| Pattern | Cause | Fix |
|---------|-------|-----|
| Timeout waiting for element | Element not rendered or wrong selector | Check `data-testid`, check data loads |
| Navigation timeout | Dev server not ready | Add `webServer` config in E2E test config |
| Click intercepted | Overlay/modal blocking element | Close modal first or scroll into view |
| Test passes locally, fails in CI | Timing/resource differences | Use proper waits, avoid hard-coded delays |
