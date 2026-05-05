# Security Review: Batch 2 (DASH-001, LIST-001, DETAIL-001) — API Routes & Frontend Pages

**Reviewer:** Security Advisor (automated)
**Date:** 2026-05-04
**Scope:** `app/api/dashboard/summary/route.ts`, `app/api/cases/route.ts`, `app/api/cases/[id]/route.ts`, `app/layout.tsx`, `app/page.tsx`, `app/cases/page.tsx`, `app/cases/[id]/page.tsx`, `lib/validations.ts`, `lib/types.ts`

## Summary

- **Risk Level:** Medium
- **Findings:** 0 Critical, 0 High, 5 Medium, 2 Low

No Critical or High findings — **the pipeline is not blocked.** The codebase demonstrates solid fundamentals: Prisma ORM throughout (no raw SQL), Zod validation on the case list endpoint, no `dangerouslySetInnerHTML`, proper `encodeURIComponent` on URL-interpolated params, and generic error messages in API responses. The main gaps are missing input length constraints, unbounded query results (no pagination), missing security headers, and unvalidated path parameters.

---

## Findings (by severity)

### MEDIUM

#### [MED-1] No `maxLength` Constraint on `search` Query Parameter

- **Location:** `lib/validations.ts:17` — `search: z.string().optional()`
- **Issue:** The `search` field in `caseListQuerySchema` accepts an unbounded string. This value is passed to Prisma's `contains` filter (which generates SQL `ILIKE '%…%'`). An attacker could submit a very long search string (e.g., 100 KB+), causing:
  1. Memory pressure building the SQL query string
  2. Database performance degradation on the `ILIKE` scan
- **Impact:** Denial-of-service potential via resource exhaustion. While Prisma parameterizes the value (no SQL injection), the performance impact of a multi-KB `ILIKE` pattern against an unindexed text column is real.
- **STRIDE:** Denial of Service
- **Fix:** Add a `max` constraint to the search field:
  ```typescript
  search: z.string().max(200).optional(),
  ```

#### [MED-2] No Pagination on Case List API — Unbounded Result Set

- **Location:** `app/api/cases/route.ts:52-68` — `prisma.amlCase.findMany({ where, orderBy, include })` with no `take` or `skip`
- **Issue:** The case list endpoint returns **all** matching cases in a single response with no pagination. As the dataset grows, this produces arbitrarily large JSON responses.
- **Impact:**
  1. **DoS:** A request with no filters returns every case in the database, potentially causing memory exhaustion on the server and slow responses.
  2. **Information disclosure:** Without pagination, a single request exposes all case metadata. In a production AML system, this would violate the principle of data minimization.
- **STRIDE:** Denial of Service, Information Disclosure
- **Fix:** Add server-side pagination:
  ```typescript
  // In validations.ts
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),

  // In route.ts
  const { page, pageSize, ...filters } = parsed.data;
  const [cases, total] = await Promise.all([
    prisma.amlCase.findMany({ where, orderBy, include, take: pageSize, skip: (page - 1) * pageSize }),
    prisma.amlCase.count({ where }),
  ]);
  ```

#### [MED-3] Dashboard Summary Fetches All Open Cases Into Memory

- **Location:** `app/api/dashboard/summary/route.ts:42-44` — `prisma.amlCase.findMany({ where: { status: OPEN_STATUS_FILTER }, select: { createdAt: true } })`
- **Issue:** To calculate `averageCaseAgeDays` and `oldestCaseAgeDays`, the endpoint loads **all** open case records into Node.js memory, then iterates over them in JavaScript. With a large case volume, this causes memory pressure and slow responses.
- **Impact:** Performance degradation and potential OOM in production with thousands of open cases. This is also an unnecessary data transfer from the database.
- **STRIDE:** Denial of Service
- **Fix:** Push the computation to the database using Prisma aggregations:
  ```typescript
  const ageMetrics = await prisma.amlCase.aggregate({
    where: { status: OPEN_STATUS_FILTER },
    _min: { createdAt: true },
    _avg: { createdAt: true }, // or use raw SQL for date arithmetic
  });
  ```
  Alternatively, use `$queryRaw` with a targeted SQL aggregation:
  ```sql
  SELECT AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::int AS avg_age,
         MAX(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::int AS max_age
  FROM aml_cases WHERE status NOT IN ('CLOSED_NO_STR', 'CLOSED_STR_FILED');
  ```

#### [MED-4] No Security Headers Configured (CSP, X-Frame-Options, etc.)

- **Location:** `next.config.ts:1-7` (empty config), no `middleware.ts` exists
- **Issue:** The application has no Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy headers configured. Next.js does not set these by default.
- **Impact:**
  1. **Clickjacking:** Without `X-Frame-Options: DENY`, the application could be embedded in a malicious iframe.
  2. **XSS mitigation layer missing:** CSP provides defense-in-depth against XSS even when output encoding is correct.
  3. **MIME sniffing:** Without `X-Content-Type-Options: nosniff`, browsers may MIME-sniff responses.
- **STRIDE:** Tampering, Information Disclosure
- **Fix:** Add security headers in `next.config.ts`:
  ```typescript
  const nextConfig: NextConfig = {
    headers: async () => [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com;" },
        ],
      },
    ],
  };
  ```

#### [MED-5] Case Detail `id` Path Parameter Not Validated

- **Location:** `app/api/cases/[id]/route.ts:10` — `const { id } = await params;`
- **Issue:** The `id` parameter from the URL path is used directly in the Prisma query without any validation. While Prisma safely parameterizes the value (preventing SQL injection), there is no check that the `id` conforms to the expected CUID format.
- **Impact:** Arbitrary strings (including very long ones) are passed to the database query. While Prisma will simply return `null` for non-matching IDs, the lack of early validation means:
  1. Unnecessary database round-trips for obviously invalid IDs
  2. No consistent error format for malformed requests (404 vs 400)
- **STRIDE:** Tampering (malformed input accepted)
- **Fix:** Add Zod validation for the path parameter:
  ```typescript
  import { z } from 'zod';
  const idSchema = z.string().cuid();

  // In the handler:
  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
  }
  ```

---

### LOW

#### [LOW-1] `console.error` Logs Full Error Objects in API Routes

- **Location:**
  - `app/api/cases/route.ts:79` — `console.error('Case list error:', error);`
  - `app/api/cases/[id]/route.ts:118` — `console.error('Case detail error:', error);`
  - `app/api/dashboard/summary/route.ts:104` — `console.error('Dashboard summary error:', error);`
- **Issue:** All three API routes log the full `error` object to stderr via `console.error`. Prisma errors can include partial query data, table names, and field values in their message. In production, this could leak sensitive information to server logs.
- **Impact:** Low in the current MVP context (fictional data, no production deployment), but violates the project's no-PII-in-logs rule if real customer data were present.
- **STRIDE:** Information Disclosure
- **Fix:** Log a structured error without the full object:
  ```typescript
  console.error('Case list error:', error instanceof Error ? error.message : 'Unknown error');
  ```

#### [LOW-2] Role Selector Is Client-Side Only — No Server-Side RBAC

- **Location:** `components/providers/role-provider.tsx:1-33`, all API routes (no auth middleware)
- **Issue:** The `RoleProvider` manages the user's role entirely in client-side React state. API routes perform no authentication or authorization checks. The role value could be trivially changed via browser devtools, and API requests carry no role context.
- **Impact:** Any user can access any endpoint and view all data. This is a **documented and accepted limitation** for the MVP (no auth in scope). Noted here for tracking as it must be resolved before production.
- **STRIDE:** Spoofing, Elevation of Privilege
- **Fix (future auth batch):** Implement authentication middleware (`middleware.ts`) that validates session tokens on all `/api/*` routes, and enforce role-based access control server-side.

---

## Positive Observations

| Area | Finding |
|------|---------|
| **Zod validation on case list** | `app/api/cases/route.ts:10-16` validates all query parameters via `caseListQuerySchema` with proper enum restrictions and defaults |
| **No raw SQL** | `grep` for `$queryRaw`, `$executeRaw`, `rawQuery` returned zero results — all queries use Prisma ORM |
| **No `dangerouslySetInnerHTML`** | `grep` across all `.tsx` files returned zero results — no XSS vectors via unescaped HTML injection |
| **No hardcoded secrets** | `grep` for passwords, secrets, API keys, tokens returned zero matches in source code |
| **`encodeURIComponent` on URL params** | `app/cases/[id]/page.tsx:13` properly encodes the `id` param when constructing the fetch URL, preventing path traversal |
| **Generic error messages** | All three API routes return generic error strings (`"Failed to fetch cases"`, etc.) — no stack traces or internal details leaked to clients |
| **TypeScript strict mode passes** | `npx tsc --noEmit` produces zero errors — no unsafe type casts or `any` usage |
| **Proper enum validation** | `lib/validations.ts` uses `z.enum()` for `status`, `riskRating`, `sortBy`, and `sortOrder` — prevents injection of arbitrary values |
| **Server Components by default** | Frontend pages are Server Components (no `"use client"` directive), reducing client-side attack surface |
| **Selective field exposure** | API responses use explicit field mapping rather than returning raw Prisma objects — no accidental exposure of internal fields like `customerId` foreign keys |

---

## STRIDE Threat Analysis (Batch 2 Scope)

| Threat | Assessment |
|--------|-----------|
| **Spoofing** | No auth exists (documented MVP limitation). API routes accept all requests without identity verification. → **LOW-2** |
| **Tampering** | All inputs go through Prisma (parameterized queries). Zod validation on case list params. Case detail `id` param is unvalidated but Prisma handles it safely. No raw SQL. → **MED-5** |
| **Repudiation** | Read-only endpoints in this batch (all GET). No state changes to audit. Audit log from Batch 1 remains intact. **Adequate for current scope.** |
| **Information Disclosure** | Generic error messages returned to clients (good). Full error objects logged server-side (minor risk). No pagination means large data dumps possible. → **LOW-1, MED-2** |
| **Denial of Service** | Unbounded search string length, no pagination on case list, in-memory age calculation on all open cases. → **MED-1, MED-2, MED-3** |
| **Elevation of Privilege** | No RBAC — all roles see all data. Accepted for MVP. → **LOW-2** |

---

## OWASP Top 10 Coverage

| # | Category | Status |
|---|----------|--------|
| A01 | Broken Access Control | ⚠️ No auth/authz (documented MVP limitation) → LOW-2 |
| A02 | Cryptographic Failures | ✅ No crypto in scope; DB connection via env var |
| A03 | Injection | ✅ Prisma ORM throughout; Zod enum validation; no raw SQL |
| A04 | Insecure Design | ⚠️ No pagination → MED-2; unbounded search → MED-1 |
| A05 | Security Misconfiguration | ⚠️ No security headers → MED-4; empty `next.config.ts` |
| A06 | Vulnerable Components | ⚠️ PostCSS moderate vuln via Next.js (carried from Batch 1) |
| A07 | Auth Failures | ⚠️ No auth (documented limitation) |
| A08 | Data Integrity Failures | ✅ No deserialization; Zod validates all structured input |
| A09 | Logging Failures | ⚠️ Full error objects logged → LOW-1 |
| A10 | SSRF | ✅ No user-controlled URLs in server-side fetches; `baseUrl` from env var |

---

## Automated Scan Results

### `npm audit`
```
2 moderate severity vulnerabilities
- postcss <8.5.10: XSS via unescaped </style> (GHSA-qx2v-qp2m-jg93)
  Transitive via next@16.2.4 (unchanged from Batch 1)
```

### `npx tsc --noEmit`
```
0 errors — TypeScript strict mode passes cleanly
```

### Hardcoded secrets scan (`grep`)
```
0 matches for password, secret, api_key, token in .ts/.tsx files
```

### Raw SQL / XSS vector scan (`grep`)
```
0 matches for $queryRaw, $executeRaw, dangerouslySetInnerHTML, innerHTML
```

---

## ReDoS Risk Assessment

- **Finding:** No regex patterns are used in any of the reviewed code. The `search` parameter uses Prisma's `contains` filter which generates a parameterized SQL `ILIKE` — this is handled by PostgreSQL's pattern matcher, not a JavaScript regex engine.
- **Conclusion:** No ReDoS risk in the current codebase.

---

## Recommendations

1. **Before next batch:** Fix MED-1 (add `maxLength` to search field) and MED-5 (validate case ID). These are one-line fixes.
2. **Before next batch:** Fix MED-2 (add pagination). This prevents unbounded responses as seed data grows.
3. **Before demo:** Fix MED-4 (add security headers in `next.config.ts`). Quick win for defense-in-depth.
4. **Optimization:** Fix MED-3 (push age calculation to DB) when performance becomes measurable.
5. **In auth batch:** Address LOW-2 with server-side authentication and RBAC middleware.
6. **Housekeeping:** Address LOW-1 by sanitizing error logging across all API routes.
