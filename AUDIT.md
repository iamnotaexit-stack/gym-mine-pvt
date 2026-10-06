# Gym Addict 2.0 - Full Audit & Fix Report

## Phase 1: Recon and Baseline

**App Map:**
- **Frontend Stack:** React 19, Vite, Tailwind CSS, TypeScript, Vite PWA.
- **Routing:** React Router DOM (HashRouter) - `/`, `/members`, `/settings`, `/chase`, `/receipt/:id`.
- **Backend Stack:** Supabase (PostgreSQL, GoTrue Auth, PostgREST, RLS).
- **Core Entities:** `members`, `plans`, `payments`, `settings`, `audit_log`, `reminder_log`.
- **Roles:** `owner` (full access), `subadmin` (create/delete members only), `member` (read-only view).

**Before Metrics:**
- **Lighthouse Performance:** To be calculated (large JS bundles > 500KB observed during build).
- **Security:** 1 high severity npm vulnerability (`source-map-js`).
- **Linting:** 26 warnings (exhaustive-deps, pure function violations, component creation inside render).

## Phase 2: Audit Findings

### A. Money and Data Logic
| ID | Area | Severity | Where | Problem | Fix | Status |
|---|---|---|---|---|---|---|
| A1 | Money Logic | Critical | `PaymentForm.tsx` & Migrations | `record_payment` RPC in migration 10 omitted the member `current_due_date` update. Payments do not advance billing cycles. | Redefine `record_payment` to include `current_due_date` update. | Pending |
| A2 | Data Integrity | High | `MemberForm.tsx` | App performs two separate Supabase `.insert` calls for member and payment instead of using the existing `create_member_with_payment` RPC. | Switch frontend to use the RPC for atomic inserts. | Pending |
| A3 | Money Logic | High | `PaymentForm.tsx`, `MemberForm.tsx` | Money is stored as integer INR, not integer paise. | Multiply inputs by 100 before insert, divide by 100 on display. Add global INR formatter. | Pending |
| A4 | Data Logic | Medium | `migrations` | The capacity trigger limits to 1000 or 200 members, but the spec demands exactly 500. | Update `check_capacity` trigger to 500. | Pending |
| A5 | Money Logic | High | `PaymentForm.tsx` | Sub-admins are blocked from payments by RLS but the UI still attempts to save payments, throwing errors. | Hide payment UI completely for sub-admins. | Pending |

### B. Security
| ID | Area | Severity | Where | Problem | Fix | Status |
|---|---|---|---|---|---|---|
| B1 | Roles/RLS | High | `migrations` | `record_payment` RPC is `SECURITY DEFINER` and does not check if the caller is an owner. Sub-admins could technically call the RPC. | Add `auth.jwt() -> 'user_metadata' ->> 'role' = 'owner'` check inside the RPC. | Pending |

### C. Speed and Load
| ID | Area | Severity | Where | Problem | Fix | Status |
|---|---|---|---|---|---|---|
| C1 | Performance | Medium | `App.tsx` | Ineffective dynamic imports for Supabase, breaking code splitting. | Refactor `supabase.ts` imports. | Pending |
| C2 | Performance | Medium | `MemberForm.tsx` | `QRCodeSVG` component is lazily created *inside* the render cycle, causing complete state loss on every re-render. | Move `React.lazy` outside the component. | Pending |

*(This report is actively being populated and resolved)*
