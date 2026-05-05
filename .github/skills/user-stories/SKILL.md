---
name: user-stories
description: Transform a business transcript or requirements document into a structured implementation plan. Use when processing transcripts, creating user stories, or planning feature development.
---

# User Stories Skill

Reference for transforming business requirements into structured, implementable user stories.

---

## Transcript Processing Workflow

When given a business transcript or requirements document:

1. **Extract actors** — identify all roles mentioned (e.g., end users, managers, admins, system)
2. **Identify capabilities** — what each actor needs to do
3. **Group by feature area** — cluster related capabilities (e.g., user management, order processing, reporting)
4. **Write user stories** — one per capability, following the format below
5. **Add acceptance criteria** — testable conditions for "done"
6. **Validate with INVEST** — check each story against INVEST criteria
7. **Split if needed** — apply splitting patterns for stories that are too large
8. **Generate test scenarios** — derive Given/When/Then tests from acceptance criteria

---

## User Story Format

```markdown
### [STORY-ID] Story Title

**As a** [role],
**I want** [goal/capability],
**So that** [business benefit/value].

#### Acceptance Criteria

- [ ] AC1: Given [context], When [action], Then [expected result]
- [ ] AC2: Given [context], When [action], Then [expected result]
- [ ] AC3: (error case) Given [context], When [invalid action], Then [error handling]

#### Technical Notes
- Implementation approach
- Dependencies
- Data model changes needed
```

### Example

```markdown
### ORD-003 Approve Order for Fulfillment

**As a** Team Lead,
**I want** to approve a pending order for fulfillment,
**So that** orders are reviewed and authorized before being shipped.

#### Acceptance Criteria

- [ ] AC1: Given an order with status "PENDING" and flagged for approval, When the team lead clicks "Approve Order", Then the order status changes to "APPROVED" and it is assigned to the fulfillment queue
- [ ] AC2: Given an order with status "APPROVED", When the manager views their dashboard, Then the approved order appears in their "Ready for Fulfillment" queue
- [ ] AC3: Given an order with status "SHIPPED", When the team lead attempts to approve, Then the system shows an error "Already-shipped orders cannot be approved"
- [ ] AC4: Given any approval action, When the approval completes, Then an audit log entry is created with actor, timestamp, reason, and previous state

#### Technical Notes
- API: PATCH /api/orders/[id]/approve
- Requires: role check (team lead), order ownership check
- Triggers: notification to fulfillment team, audit log entry
```

---

<!-- Enhanced with patterns from Paweł Huryn / user-stories (INVEST) -->
## INVEST Criteria Validation

Every user story MUST pass all six INVEST criteria before being accepted into the backlog:

| Criterion | Question | Red Flag |
|-----------|----------|----------|
| **I**ndependent | Can this story be developed and delivered without waiting for other stories? | "We need ORD-001 done first" → split or reorder |
| **N**egotiable | Is the implementation flexible, or is it over-specified? | Step-by-step UI instructions → rewrite as outcome |
| **V**aluable | Does it deliver value to the end user or business? | "Refactor database schema" → not a user story (make it a task) |
| **E**stimable | Can the team estimate effort? | "Integrate with all external systems" → too vague, spike first |
| **S**mall | Can it be completed in one sprint (1-5 days)? | Epic-sized → apply splitting patterns |
| **T**estable | Can we write a test that proves it's done? | "System should be fast" → add measurable criteria |

### Validation Checklist

```markdown
#### INVEST Check: [STORY-ID]
- [x] Independent: No blocking dependencies
- [x] Negotiable: Describes what, not how
- [x] Valuable: Delivers user-visible capability
- [x] Estimable: Clear scope, team can estimate
- [ ] Small: ~3 days effort ⚠️ Consider splitting
- [x] Testable: All ACs are verifiable
```

---

<!-- Enhanced with patterns from Dean Peters / user-story-splitting -->
## Story Splitting Patterns

When a story is too large (> 5 days), apply one of these 8 splitting patterns:

### 1. Workflow Steps

Split along the steps of a business process:

```
ORIGINAL: "As a team member, I want to manage the full order lifecycle"

SPLIT:
- ORD-001: Create a new order
- ORD-002: Assign order to team
- ORD-003: Approve order for fulfillment
- ORD-004: Complete and close order
```

### 2. Business Rule Variations

Split by different business rules or conditions:

```
ORIGINAL: "As a system, I want to calculate pricing"

SPLIT:
- PRICE-001: Calculate base price from product catalog
- PRICE-002: Apply discount rules based on customer tier
- PRICE-003: Calculate tax based on shipping destination
- PRICE-004: Calculate combined total from all factors
```

### 3. Data Variations

Split by different data types or inputs:

```
ORIGINAL: "As a user, I want to search for products"

SPLIT:
- SEARCH-001: Search products by ID
- SEARCH-002: Search products by name
- SEARCH-003: Filter products by category
- SEARCH-004: Filter products by date range
```

### 4. Interface Variations

Split by different interfaces or channels:

```
ORIGINAL: "As a user, I want to view order details"

SPLIT:
- VIEW-001: Order summary card in list view
- VIEW-002: Full order detail page
- VIEW-003: Order timeline/activity log
- VIEW-004: Order attachments/documents panel
```

### 5. Simple/Complex (Happy Path First)

Deliver the simple version first, then add complexity:

```
ORIGINAL: "As a manager, I want to process a return"

SPLIT:
- RET-001: Create return request with required fields only (happy path)
- RET-002: Handle return validation errors and drafts
- RET-003: Support return amendments and supplementary filings
- RET-004: Track refund status and completion
```

### 6. Major Effort

Split out the technically expensive part:

```
ORIGINAL: "As a user, I want to see real-time notifications"

SPLIT:
- NOTIF-001: View pre-generated notifications (batch, simple query)
- NOTIF-002: Real-time streaming notifications (WebSocket, complex)
```

### 7. Defer Performance

Make it work first, optimize later:

```
SPLIT:
- REPORT-001: Generate analytics report (basic, may be slow)
- REPORT-002: Optimize report generation (caching, pagination)
```

### 8. Break Out a Spike

When unknowns exist, spike first:

```
SPLIT:
- SPIKE-001: Investigate third-party API integration requirements (timeboxed 2 days)
- INTEG-001: Implement third-party API submission (after spike findings)
```

---

<!-- Enhanced with patterns from Paweł Huryn / test-scenarios -->
## Test Scenario Generation

For each acceptance criterion, generate test scenarios in Given/When/Then format. Include happy paths, edge cases, and error paths.

### Process

1. Take each AC from the story
2. Generate the **happy path** scenario
3. Generate **edge cases** (boundary values, empty states, concurrent access)
4. Generate **error paths** (invalid input, unauthorized, system failure)
5. Format as executable test scenarios

### Template

```gherkin
Feature: [Story Title]

  Scenario: [Happy path description]
    Given [initial state/context]
    And [additional context if needed]
    When [user action or system event]
    Then [expected outcome]
    And [additional verification]

  Scenario: [Edge case description]
    Given [boundary condition]
    When [action at boundary]
    Then [expected behavior at boundary]

  Scenario: [Error path description]
    Given [error-inducing context]
    When [action that triggers error]
    Then [error is handled gracefully]
    And [user sees appropriate message]
```

### Example (Order Approval)

```gherkin
Feature: Approve Order for Fulfillment

  Scenario: Successful approval of pending order
    Given an order "ORD-2024-001" with status "PENDING" and flagged for approval
    And the order is assigned to team lead "lead-jane"
    And team lead "lead-jane" is logged in
    When the team lead clicks "Approve Order" and provides reason "Verified by customer"
    Then the order status changes to "APPROVED"
    And the order is assigned to the fulfillment queue
    And a notification is sent to the fulfillment team
    And an audit entry is created with action "ORDER_APPROVED"

  Scenario: Approval of urgent order
    Given an order with priority flag "URGENT"
    And the order is pending approval
    When the team lead approves with reason "Rush delivery requested"
    Then the order is approved with priority flag "URGENT"

  Scenario: Cannot approve already-shipped order
    Given an order with status "SHIPPED"
    When the team lead attempts to approve
    Then the approval is rejected
    And error message "Already-shipped orders cannot be approved" is shown

  Scenario: Cannot approve cancelled order
    Given an order with status "CANCELLED"
    When the team lead attempts to approve
    Then the approval is rejected
    And error message "Cancelled orders cannot be approved" is shown

  Scenario: Concurrent approval attempt
    Given an order that is being approved by another user simultaneously
    When both approval requests arrive
    Then only one approval succeeds (optimistic locking)
    And the second user sees "Order has already been approved"
```

### Mapping to Test Code

Each scenario maps to a test:

```typescript
// Unit test (service layer)
describe('approveOrder', () => {
  test('should approve PENDING order for fulfillment', async () => {
    // Given
    const order = await createTestOrder({ status: 'PENDING', flagged: true });
    // When
    const result = await approveOrder(order.id, { reason: 'Verified by customer', actorId: 'lead-1' });
    // Then
    expect(result.status).toBe('APPROVED');
    expect(result.assignedQueue).toBe('FULFILLMENT');
  });

  test('should reject approval of SHIPPED order', async () => {
    const order = await createTestOrder({ status: 'SHIPPED' });
    await expect(approveOrder(order.id, { reason: 'test', actorId: 'lead-1' }))
      .rejects.toThrow('Already-shipped orders cannot be approved');
  });
});

// E2E test
test('team lead approves pending order', async ({ page }) => {
  const orderDetail = new OrderDetailPage(page);
  await orderDetail.goto('ORD-2024-001');
  await orderDetail.clickApprove();
  await orderDetail.fillReason('Verified by customer');
  await orderDetail.confirmApproval();
  await expect(orderDetail.statusBadge).toHaveText('APPROVED');
});
```

---

## Output Format

When generating user stories from a transcript, produce output in this structure:

```markdown
# Feature: [Feature Name]

## Epic Summary
[1-2 sentence description of the feature area]

## User Stories

### [ID] Story Title
[Full story in format above]

---

## Story Map

| Priority | Story ID | Title | Size (days) | Dependencies |
|----------|----------|-------|-------------|--------------|
| P0 | ORD-001 | Create new order | 2 | None |
| P0 | ORD-002 | View order list | 2 | ORD-001 |
| P1 | ORD-003 | Approve order | 3 | ORD-001 |

## Test Scenarios
[Generated scenarios for each story]
```
