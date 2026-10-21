# CR-001 — Implementation preparation status

**Date:** 2026-10-21
**Status:** AUTH/RLS DISCOVERY BLOCKED — preparatory code ONLY
**Working branch:** `feature/cr-001-auth-contract-prep-20261021`
**Reference:** [Design PR #1](https://github.com/WillHuyler/gmb-serp-dashboard/pull/1)

## Completed with no runtime impact

- Added `lib/security/cr001-authorization-policy.ts`, a **pure, unused** policy evaluator with typed failure outcomes.
- Added `docs/security/CR-001-supabase-readonly-contract-checks.sql`, containing SELECT-only Supabase catalog inspection queries.
- The branch starts from main commit `638cc0ea7e0630516166455c34e387bf34417134`.
- There have been no edits to `lib/auth-guard.ts`, routes, database, environment files, CI configuration, or deployment settings.

## Confirmed from GitHub repository scan

- `lib/auth-guard.ts` currently defines fixed mock principal and a client allowlist.
- The main repository does not contain actual Supabase RLS policies, membership table migrations, or proof of the production auth provider.
- Other connected repositories also did not yield an authoritative schema for PorchLight. That is **not evidence that RLS doesn't exist** in Supabase.
- The Supabase plugin has been installed, but its database-operation endpoints were not exposed in this active execution environment. Therefore real Auth/RLS contracts remain **UNVERIFIED**.

## Remains blocked (DO NOT IMPLEMENT YET)

- Any rewrite of `validateClientAccess` or authenticated API handlers.
- Any change to Supabase RLS, tenancy, schema, service role usage or database records.
- Any real client mapping or production ingestion.
- Any merge or Vercel deployment.

## Read-only evidence needed

1. Confirm correct Supabase project and whether sign-in uses Supabase Auth or existing external identity provider.
2. Inspect table names, columns, FKs, unique constraints, tenant membership tables, RLS policy expressions, and roles/grants.
3. Inspect current session propagation mechanism in Vercel (cookies/headers/auth middleware).
4. Determine whether the current deployment contains an externally hosted OAuth/auth proxy omitted from this repository.
5. Verify against two isolated test principals after a plan is approved.

## Authorization policy integration guard

`AuthenticatedPrincipal`, `VerifiedTenantMembership`, and `ResolvedClientOwnership` are **trusted-input boundary types**, not security enforcement themselves. All inputs must be obtained by server-verified mechanisms and must remain scoped by RLS or equivalent server authorization. The pure policy module is intentionally NOT imported into any production handler.

## Approval / release

Existing owner authorization covers **preparation on isolated branch only**. It does not authorize wiring in a new auth provider, changing production database/schema, enabling access to real clients, merging the branch, or deploying.

## Test status

- Source review: completed.
- Compilation: not run.
- Unit and integration tests: not run.
- Two-user/two-tenant RLS and session tests: blocked until DB access.
- Deployment: not attempted.
