# Architectural & Business Rule Decisions

## Overview
This document records all business rules explicitly confirmed by the gym owner and encoded in the system.

## Decisions

### 1. Capacity Limits
- **Decision:** The gym is capped at 200 active members.
- **Implementation:** A PostgreSQL trigger (`enforce_member_capacity`) blocks insertions if active non-deleted members >= 200.

### 2. Payments & Idempotency
- **Decision:** A member cannot be recorded as paying for the exact same `covers_to` and `covers_from` date range twice.
- **Implementation:** The Supabase RPC `record_payment` enforces strict deduplication checks and handles multi-step updates (inserting a payment and updating the member's `current_due_date`) atomically in a database transaction.

### 3. Grace Periods
- **Decision:** The system allows for a standard grace period (default 3 days) during which the member is considered "Due" but not penalized as "Overdue".
- **Implementation:** Client-side due date calculations evaluate `grace_days` from the `settings` table before classifying a member's real-time status.

### 4. Soft Deletes
- **Decision:** When a member leaves or is removed, their profile is soft-deleted to retain revenue and payment history for accounting.
- **Implementation:** Setting `deleted_at` on a member hides them from the active list but does not CASCADE delete their past payments.

### 5. Role-Based Access Control (RBAC)
- **Decision:** Sub-admins can view, create, and update members, but only the Owner can access payments, settings, stats, and permanently hard-delete records.
- **Implementation:** Strict Row Level Security (RLS) policies are enforced at the database level ensuring that API requests are securely gated based on `get_auth_role()`.

### 6. WhatsApp Reminders
- **Decision:** WhatsApp reminders must support trilingual regional localization (English, Hindi, Assamese) out-of-the-box for Guwahati area gyms.
- **Implementation:** Hardcoded regional strings in `LanguageContext` allow dynamic template interpolation.

### 7. Timezones
- **Decision:** All day boundary checks, due dates, and UI stats must explicitly evaluate the current date in Indian Standard Time (IST), regardless of where the client device is located.
- **Implementation:** Custom offset logic in `dates.ts` calculates `getCurrentISTDateString` to guarantee `Asia/Kolkata` alignment.
