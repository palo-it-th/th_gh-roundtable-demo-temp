---
name: code-quality
description: Code simplification patterns and refactoring guidelines. Use when reviewing, refactoring, or simplifying code.
---

# Code Simplification Patterns

> **Note:** Core coding standards (TypeScript rules, naming, import order, error handling, React/Next.js patterns) are in `copilot-instructions.md`. This skill covers **simplification techniques** only.

## Reduce Nesting — Guard Clauses

```typescript
// ❌ Deeply nested
if (user) {
  if (user.role === 'mlro') {
    if (case.status === 'open') {
      // do thing
    }
  }
}

// ✅ Guard clauses
if (!user) return;
if (user.role !== 'mlro') return;
if (case.status !== 'open') return;
// do thing
```

## Avoid Nested Ternaries

```typescript
// ❌
const label = status === 'open' ? 'Open' : status === 'closed' ? 'Closed' : 'Unknown';

// ✅
function getStatusLabel(status: string): string {
  switch (status) {
    case 'open': return 'Open';
    case 'closed': return 'Closed';
    default: return 'Unknown';
  }
}
```

## Early Returns

- Return early for error/edge cases at the top of a function
- Keep the "happy path" at the lowest indent level

## Extract Helpers

- If a block of code needs a comment to explain what it does, extract it into a named function
- If a pattern appears 3+ times, extract it
