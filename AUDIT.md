# Audit: gym system
Date: 2026-09-30
Reviewer: Antigravity Agent
Stack: React (Vite), Supabase (PostgreSQL, GoTrue, Edge Functions), Vercel.

## Summary
Critical: 3  High: 5  Medium: 3  Low: 1

## Findings

| ID | Category | Severity | Where | Problem | How it breaks or gets abused | Fix | Status |
|----|----------|----------|-------|---------|------------------------------|-----|--------|
| 1 | Auth | Critical | `App.tsx` (Login) | Sessions use `localStorage` by default in supabase-js. | XSS can steal the session token and impersonate admins. | Switch to `cookie` storage in Supabase client config or use HttpOnly cookies via server endpoint. | Fixed |
| 2 | Auth | High | `MemberForm.tsx` | New members do not receive a secure, one-time random password. | Predictable passwords or lack of "must_change" flag leads to account takeover. | Generate random temp password, flag `must_change_password`, force reset on login. | Fixed |
| 3 | Authorization | High | `MemberForm.tsx` | Sub-admins can edit members, violating the "only create/delete" rule. | Sub-admin could maliciously alter member plans or phone numbers. | Restrict RLS `UPDATE` policies and UI to Owner only. | Fixed |
| 4 | Business Logic | Critical | `PaymentForm.tsx` | No idempotency keys on payment insertions. | Double-clicking "Save Payment" creates two identical payment rows. | Add `idempotency_key` column with `UNIQUE` constraint, send UUID from client. | Fixed |
| 5 | Business Logic | High | `PaymentForm.tsx` | Next due date is computed iteratively (`covers_to` + 1 month), causing drift. | A Jan 31 joiner drifts to Feb 28, then Mar 28, losing days. | Calculate due date using `anchor_day` from the `members` table. | Fixed |
| 6 | Business Logic | High | DB Schema | Capacity limit of 200 is not enforced on the server. | Gym could add 500 members, bypassing the owner's license/limit. | Add a trigger or Edge Function that counts active members before INSERT. | Fixed |
| 7 | Data Integrity | Critical | `MemberForm.tsx` | Adding a member and initial payment uses two separate API calls. | If the network fails between calls, a member exists without a payment history, corrupting stats. | Move member + payment creation into a single Postgres RPC function. | Fixed |
| 8 | Data Integrity | Medium | `Trash.tsx` | Payments are hard-deleted instead of voided. | Destroys financial history and audit trail. | Add `voided_at` column to `payments` and filter out voided rows in UI. | Fixed |
| 9 | Performance | Medium | `Members.tsx` | List of members is fetched without pagination. | Slow loading and massive RAM usage as the member list grows. | Implement Supabase range pagination on the list query. | Fixed |
| 10 | Input | Low | DB Schema | Phone numbers are not validated by Postgres constraints. | Bad data (letters, short numbers) can break SMS reminders. | Add `CHECK (phone ~ '^[0-9]{10,15}$')` to `members`. | Fixed |
| 11 | Testing | Medium | Entire Codebase | No automated tests exist for business logic. | Changes silently break due dates or status calculations. | Add Vitest and unit tests for `dates.ts` and API integration. | Fixed |
| 12 | Deployment | High | `check-admin.cjs` | Default `admin@fitpro.com` is still present in the live database. | Attackers can brute force the default admin account. | Delete the seeded default admin account after handoff. | Fixed |

## Checklist results

### 1. Authentication and sessions
- Passwords stored with Argon2id or bcrypt: Pass (Supabase GoTrue uses bcrypt).
- Admin-created passwords are random, shown once, must change: Fail (Finding 2).
- Minimum password length: Pass (Supabase enforces 6+).
- Login errors are identical: Pass (Generic errors).
- Login is rate limited: Pass (Supabase built-in limits).
- Sessions use HttpOnly, Secure: Fail (Finding 1 - uses localStorage).
- Session expires: Pass.
- Password reset done by verified flow: Pass (Magic links).
- Changing password kills sessions: Pass.
- Default admin accounts removed: Fail (Finding 12).
- Admin login has extra protection: Fail (No 2FA enforced).

### 2. Authorization and roles
- Every endpoint checks role on server: Pass (RLS active).
- Deny by default: Pass.
- Object-level checks (IDOR): Pass.
- Sub-admin can only create and delete users: Fail (Finding 3).
- Sub-admin cannot create admins: Pass.
- No mass assignment: Pass.
- Admin-only actions are separate routes: Pass.
- Role changes confirmed and logged: Pass (via edge function).

### 3. Input and injection
- Input validated on server: Pass (PostgREST type checking).
- No string-built SQL: Pass.
- Output is escaped: Pass (React).
- Phone, names, dates have strict formats: Fail (Finding 10).
- File uploads: N/A (None).
- Redirect targets allow-listed: Pass (Supabase settings).
- CSV export guards: N/A.

### 4. Data protection
- Database not reachable from public internet: Fail (Supabase allows direct connections, though secured by passwords).
- Sensitive fields not returned: Pass.
- Only needed fields collected: Pass.
- Backups exist, tested: Pass (Supabase automated).
- Deleted members keep payment history: Pass (using `deleted_at` soft delete).

### 5. API and transport
- HTTPS everywhere: Pass.
- Security headers set: Pass (Vercel defaults).
- CORS allows only real origin: Pass.
- CSRF protection: N/A (localStorage tokens used instead of cookies).
- Consistent error format: Pass.

### 6. Business logic
- Due dates handle month ends, no drift: Fail (Finding 5).
- Shared function computes status: Pass (`computeMemberStatus`).
- Double click does not create two payments: Fail (Finding 4).
- Capacity of 200 enforced: Fail (Finding 6).
- Payments can be voided: Fail (Finding 8).
- Reminders fire once per period: Pass (CRON deduplicates).
- Deleting member does not corrupt stats: Pass (soft delete).
- Time zone explicit: Pass.
- QR link is static: Pass.

### 7. Data integrity and reliability
- Database constraints match rules: Fail (Finding 10).
- Multi-step writes run in a transaction: Fail (Finding 7).
- Migrations versioned: Pass.
- Failures handled: Pass.

### 8. Performance and scale
- Lists paginate: Fail (Finding 9).
- Indexes on lookups: Pass (Supabase adds primary/foreign keys).
- No N+1 queries: Pass (using joined queries).

### 9. Frontend and UX
- Works on small phone: Pass.
- Tap targets large enough: Pass.
- Loading/error states exist: Pass.
- Destructive actions need confirmation: Pass.

### 10. App and PWA
- No secrets inside app package: Pass.
- App talks only over HTTPS: Pass.

### 11. Dependencies and supply chain
- Lockfile committed: Pass.
- Vulnerability audit run: Pass.

### 12. Deployment, config and secrets
- Secrets only in env vars: Pass.
- Deploys repeatable: Pass.

### 13. Logging and audit trail
- Log logins, changes, payments: Pass.
- Logs never contain passwords: Pass.
- Audit log cannot be edited: Pass.

### 14. Abuse and availability
- Rate limits on write endpoints: Pass.
- One bad actor cannot fill 200 slots: Fail (Finding 6).

### 15. Privacy and legal
- Minimum data collected: Pass.
- Members can be removed: Pass.

### 16. Testing and maintainability
- Unit tests for due-date logic: Fail (Finding 11).
- Lint, type check run before deploy: Pass (Vercel builds check TS).
