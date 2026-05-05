---
name: security-checklist
description: Security review checklist for financial applications. Covers input validation, secrets handling, error exposure, CSRF/XSS prevention, and audit log integrity. Use when performing security reviews.
---

# Security Review Checklist

This checklist is designed for the **security-advisor** agent reviewing code in the application. Every PR touching API routes, services, or data access must pass these checks.

---

## Input Validation

- [ ] All API route handlers validate input with schema validation
- [ ] Request body, query params, and path params are all validated
- [ ] Validation errors return structured JSON with 400 status (no stack traces)
- [ ] File uploads are restricted by type, size, and scanned for malware
- [ ] Numeric inputs have min/max bounds (especially monetary amounts)
- [ ] String inputs have max length constraints
- [ ] Arrays have max item constraints to prevent DoS

```typescript
// ✅ Correct: Schema validation in API route
import { z } from 'zod';

const CreateOrderSchema = z.object({
  userId: z.string().uuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  amount: z.number().positive().max(999_999_999_999),
  description: z.string().max(5000),
  tags: z.array(z.string()).max(50),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  // ... proceed with parsed.data
}
```

---

## Secrets Handling

- [ ] No credentials, API keys, or tokens in source code
- [ ] Environment variables used for all secrets
- [ ] `.env` files are in `.gitignore`
- [ ] No secrets logged (even at DEBUG level)
- [ ] Database connection strings use environment variables
- [ ] JWT secrets are sufficiently long (256+ bits)
- [ ] Secrets are rotated periodically (documented in runbook)

---

## Error Exposure

- [ ] Production errors never expose stack traces to clients
- [ ] Database errors are caught and return generic messages
- [ ] ORM errors (e.g. unique constraint, not found) are mapped to user-friendly responses
- [ ] No internal file paths leaked in error responses
- [ ] Error logging captures full details server-side only

```typescript
// ✅ Correct: Map ORM errors to user-friendly responses
function handleDatabaseError(error: unknown): Response {
  if (error instanceof Error) {
    if (error.message.includes('unique constraint')) {
      return Response.json({ error: 'Record already exists' }, { status: 409 });
    }
    if (error.message.includes('not found')) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
```

---

## CSRF / XSS Prevention

- [ ] State-changing endpoints use CSRF tokens or built-in framework protection
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] User-generated content is escaped before rendering
- [ ] Content-Security-Policy headers are configured
- [ ] HttpOnly, Secure, SameSite flags on cookies
- [ ] API routes validate Origin/Referer headers for state-changing operations

---

## Audit Log Integrity

- [ ] All entity state changes are logged with: who, what, when, from-state, to-state
- [ ] Audit logs are append-only (no UPDATE/DELETE on audit tables)
- [ ] Log entries include IP address and session ID
- [ ] No PII (customer names, national IDs, account numbers) in application logs
- [ ] Audit trail is tamper-evident (sequential IDs, timestamps)
- [ ] Sensitive actions are logged with additional context

```typescript
// ✅ Correct: Audit log entry
interface AuditEntry {
  action: string;
  entityType: 'ORDER' | 'USER' | 'DOCUMENT';
  entityId: string;
  userId: string;
  previousState: Record<string, unknown>;
  newState: Record<string, unknown>;
  ipAddress: string;
  timestamp: Date;
}
```

---

<!-- Enhanced with patterns from Trail of Bits / insecure-defaults -->
## Insecure Defaults

Check for these common insecure default configurations:

### Hardcoded Secrets
- [ ] No hardcoded JWT secrets (`const SECRET = "..."`)
- [ ] No default passwords in seed data that could reach production
- [ ] No API keys embedded in client-side code
- [ ] No hardcoded encryption keys or IVs

```typescript
// ❌ INSECURE: Hardcoded secret
const JWT_SECRET = 'super-secret-key-123';

// ✅ SECURE: Environment variable with validation
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}
```

### Weak Cryptography
- [ ] No MD5 or SHA1 for password hashing (use bcrypt/argon2)
- [ ] No custom crypto implementations
- [ ] AES keys are 256-bit minimum
- [ ] Random values use `crypto.randomUUID()` or `crypto.getRandomValues()`, never `Math.random()`

### Insecure TLS / Network
- [ ] No `NODE_TLS_REJECT_UNAUTHORIZED=0` in production
- [ ] No `rejectUnauthorized: false` in HTTPS requests
- [ ] Database connections use TLS in production
- [ ] No HTTP (non-TLS) endpoints for sensitive data

### Permissive CORS
- [ ] CORS origin is not `*` for authenticated endpoints
- [ ] CORS credentials mode is restricted to known origins
- [ ] Preflight responses don't expose sensitive headers

```typescript
// ❌ INSECURE: Wildcard CORS
headers: { 'Access-Control-Allow-Origin': '*' }

// ✅ SECURE: Explicit origin allowlist
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
const origin = request.headers.get('Origin');
if (origin && ALLOWED_ORIGINS.includes(origin)) {
  headers.set('Access-Control-Allow-Origin', origin);
}
```

### Debug Mode in Production
- [ ] No `DEBUG=*` or verbose logging in production builds
- [ ] Framework error overlays are disabled in production
- [ ] No ORM query logging in production
- [ ] No exposed GraphQL introspection in production

---

<!-- Enhanced with patterns from Trail of Bits / sharp-edges -->
## Error-Prone APIs & Sharp Edges

These APIs and patterns are inherently dangerous. Flag any usage for immediate review:

### Forbidden APIs
- [ ] No `eval()` or `Function()` constructor
- [ ] No `child_process.exec()` with user input (use `execFile` with args array)
- [ ] No `dangerouslySetInnerHTML` without DOMPurify sanitization
- [ ] No `JSON.parse()` on untrusted input without try/catch and schema validation
- [ ] No `new Function()` for dynamic code execution
- [ ] No `setTimeout`/`setInterval` with string arguments

```typescript
// ❌ DANGEROUS: Command injection
import { exec } from 'child_process';
exec(`grep ${userInput} /var/log/app.log`); // Shell injection!

// ✅ SAFE: Parameterized command
import { execFile } from 'child_process';
execFile('grep', [userInput, '/var/log/app.log']); // No shell interpretation
```

### Unsafe Deserialization
- [ ] No `JSON.parse()` of user input without schema validation after parsing
- [ ] No deserialization of binary formats from untrusted sources
- [ ] No `Object.assign()` or spread from untrusted sources without allowlist

### Integer / Numeric Issues
- [ ] Monetary calculations use integer cents (not floating point)
- [ ] `Number.isSafeInteger()` check for large values from external sources
- [ ] No implicit number coercion from strings without explicit parsing

```typescript
// ❌ DANGEROUS: Floating point money
const total = 0.1 + 0.2; // 0.30000000000000004

// ✅ SAFE: Integer cents
const totalCents = 10 + 20; // 30 (representing $0.30)
```

### Time-of-Check-Time-of-Use (TOCTOU)
- [ ] Authorization checks happen atomically with data access
- [ ] No gap between "check permission" and "perform action" in separate queries
- [ ] Use database transactions for check-then-act patterns

### Path Traversal
- [ ] File paths from user input are validated against an allowlist
- [ ] No `../` sequences in file paths from requests
- [ ] Use `path.resolve()` and verify result is within expected directory

---

<!-- Enhanced with patterns from OpenAI / security-best-practices -->
## TypeScript/Node.js Specific

Security patterns specific to the TypeScript/Node.js ecosystem:

### Prototype Pollution
- [ ] No `Object.assign({}, untrustedData)` — use structured clone or schema validation
- [ ] No deep merge utilities on untrusted input without prototype-safe implementation
- [ ] Check for `__proto__`, `constructor`, `prototype` keys in user input
- [ ] Prefer `Object.create(null)` for lookup maps from untrusted data

```typescript
// ❌ VULNERABLE: Prototype pollution
function merge(target: any, source: any) {
  for (const key in source) {
    target[key] = source[key]; // __proto__ can be set!
  }
}

// ✅ SAFE: Schema validation strips unknown keys
const SafeInput = z.object({
  name: z.string(),
  value: z.number(),
}).strict(); // .strict() rejects unknown keys
```

### Regex Denial of Service (ReDoS)
- [ ] No user-supplied regex patterns
- [ ] Complex regexes are tested with worst-case input
- [ ] Use `re2` library for untrusted patterns if regex is required
- [ ] String matching preferred over regex for simple checks

### Unsafe Type Coercion
- [ ] No `==` comparisons (always `===`)
- [ ] No implicit boolean coercion for security checks (`if (user)` vs `if (user !== null)`)
- [ ] Schema `.coerce` is only used on trusted internal data

### Template Literal Injection
- [ ] No SQL via template literals — always use parameterized queries
- [ ] No HTML construction via template literals — use framework templating
- [ ] No URL construction via template literals without URL class validation

```typescript
// ❌ VULNERABLE: Template SQL injection
const query = `SELECT * FROM orders WHERE id = '${orderId}'`;

// ✅ SAFE: Parameterized query
const order = await db.orders.findById(orderId);
```

### Supply Chain
- [ ] Dependencies are pinned to exact versions in `package-lock.json`
- [ ] No `postinstall` scripts from untrusted packages
- [ ] Regular `npm audit` checks (automated in CI)

---

<!-- Enhanced with patterns from BehiSecc / vibesec -->
## Web Application Vulnerabilities

Common web vulnerabilities relevant to the application:

### Insecure Direct Object References (IDOR)
- [ ] All resource access checks user's permission for that specific resource
- [ ] Resource IDs in URLs are validated against user's authorized resources
- [ ] No sequential/guessable IDs exposed to clients (use UUIDs)
- [ ] Tenant isolation verified for multi-team access

```typescript
// ❌ VULNERABLE: No authorization check
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const order = await db.orders.findById(params.id);
  return Response.json(order);
}

// ✅ SECURE: Authorization check
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  const order = await db.orders.findOne({
    where: { id: params.id, teamId: session.user.team },
  });
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(order);
}
```

### Server-Side Request Forgery (SSRF)
- [ ] No user-controlled URLs in server-side fetch/HTTP calls
- [ ] Webhook URLs are validated against allowlists
- [ ] Internal service URLs are not constructible from user input
- [ ] DNS rebinding protection for URL validation

### Mass Assignment
- [ ] API routes explicitly pick allowed fields (never spread request body into ORM)
- [ ] ORM `select` or explicit field mapping on updates
- [ ] Role/permission fields cannot be set via user input

```typescript
// ❌ VULNERABLE: Mass assignment
await db.orders.update({
  where: { id },
  data: req.body, // User could set { role: 'ADMIN', status: 'CLOSED' }
});

// ✅ SECURE: Explicit field selection
const { description, priority } = validated.data;
await db.orders.update({
  where: { id },
  data: { description, priority },
});
```

### Broken Access Control
- [ ] Role-based access enforced at API route level (middleware)
- [ ] Admin-only actions (approvals, deletions) have explicit role checks
- [ ] Horizontal privilege escalation prevented (user can't access other team's resources)
- [ ] Vertical privilege escalation prevented (regular user can't perform admin actions)

### Security Misconfiguration
- [ ] Security headers set: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security
- [ ] Directory listing disabled
- [ ] Default API routes don't expose framework internals
- [ ] Rate limiting on authentication and sensitive endpoints
- [ ] Error pages don't reveal technology stack
