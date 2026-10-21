# CR-001 — Preparation status / release gate

**Date:** 2026-10-21  
**Branch:** `feature/cr-001-auth-contract-prep-20261021`  
**PR:** [Draft PR #2](https://github.com/WillHuyler/gmb-serp-dashboard/pull/2)  
**Status:** SOURCE + DATABASE METADATA INSPECTED; APPLICATION INTEGRATION **NOT APPROVED**.

## Completed (isolated branch only)

- `lib/security/cr001-authorization-policy.ts`: pure, unused typed authorization-decision function.
- `lib/security/cr001-supabase-principal.ts`: unused verifier for a Supabase Auth access token using `supabase.auth.getUser(jwt)`, requiring a separate tenant/client check.
- `docs/security/CR-001-supabase-readonly-contract-checks.sql`: SELECT-only metadata queries.
- Source audit: identifies mock server authorization, missing application sign-in/session propagation and client API trust issues.
- Authorized read-only Supabase metadata review: project, Auth/profile existence, tables, RLS configuration, constraints, adviser findings. **No database write or RLS configuration change.**

## Verified design implications (public-safe summary)

- Supabase Auth and linked user profile tables exist.
- A tenant membership table exists but its current population does not support switching directly to mandatory membership checks without an account-recovery/bootstrap plan.
- Multiple authorization/row-isolation findings require **restricted security review and remediation**. Detailed findings deliberately are NOT committed to this public repository.
- The repository lacks a verified mechanism to propagate Supabase Auth sessions from the browser to Next.js API routes. Do not wire in the unused token verifier until a session transport is approved.
- Existing clients and tenant IDs must be inventoried without reassignment or deletion.
- App-level authorization, RLS, provider resource scope, and service-token permission are independently required controls.

## Blocking implementation decisions

1. Approve existing Supabase Auth as application identity provider and a secure browser/server session transport for Next.js 14.
2. Review privileged user bootstrap when membership records are absent, without introducing a permanent default-tenant fallback.
3. Approve separate staged remediation plan for exposed tables, overly permissive policies, and privileged database functions.
4. Validate a two-tenant negative-path matrix against an isolated safe test environment before production.
5. Confirm which Vercel deployment/branch and SQL project the actual running app uses.

## Approval states

- Initial read-only investigation: approved and completed.
- Branch-local, unused CR-001 implementation prototypes: approved and prepared.
- Importing auth module into routes: NOT approved.
- Applying DDL, creating users or memberships, replacing RLS policies: NOT approved.
- Merging, production deployment, data import: NOT approved.

## Verification status

- Code and metadata review: performed.
- Actual auth login/session route and end-to-end access: NOT verified.
- Unit/build/browser tests: NOT run.
- Production changes: NONE.
- Next step: owner review of private security findings, selected session approach, and proposed ordered security remediation.
