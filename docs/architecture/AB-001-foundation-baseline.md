# AB-001 — PorchLight foundation architecture baseline

**Status:** VERIFIED SOURCE BASELINE / RUNTIME UNVERIFIED  
**Date:** 2026-10-21  
**Repository:** WillHuyler/gmb-serp-dashboard  
**Inspected ref:** main at 638cc0ea7e0630516166455c34e387bf34417134  
**Change mode:** Documentation only; no runtime changes authorized in this record.  
**Scope:** CR-001 authentication/authorization and CR-002 authoritative client registry.

## Source-verified architecture

- Next.js 14 App Router, TypeScript/React, Tailwind, Supabase JS.
- Root layout \`app/layout.tsx\` mounts \`ClientProvider\` from \`lib/client-context.tsx\` and renders a fixed sidebar/header.
- \`lib/client-context.tsx\` declares \`AUTHORITATIVE_CLIENT_REGISTRY\` in source and initializes the active client from its first item. This is currently the *effective* UI client authority, not verified DB contents.
- A separate \`components/providers/client-provider.tsx\` fetches \`/api/clients\` and directly queries Supabase as fallback. It is not mounted by the root layout. **Do not assume replacing the root import with this component would be safe.**
- \`app/api/clients/route.ts\` implements only GET with an anonymous Supabase client and no request-session authorization.
- \`lib/auth-guard.ts\` returns fixed/mock identity and client membership, not caller-derived identity.
- \`app/api/data/mappings/route.ts\` inserts mapping rows and sets \`clients.is_certified=true\` merely after insertion.
- \`app/api/integrations/sync/route.ts\` acknowledges a sync based on hardcoded client registry with no provider request/persistence in this handler.
- \`app/api/cron/daily-etl/route.ts\` uses hardcoded client registry and provider functions returning literal metric values; one result can be mistaken for real ingestion.
- \`app/api/health/route.ts\` checks a DB read and returns hardcoded provider HEALTHY values.
- \`app/api/auth/[provider]/route.ts\` contains a mock OAuth completion redirect, not a token exchange.
- \`app/command-center/page.tsx\` uses hardcoded KPI values and dates; the full interactive view was substantially removed by commit 84027397cc6f.
- \`components/navigation/AppSidebar.tsx\` links Dashboard to /command-center, replaces Clients with Connection Center; no \`app/clients/page.tsx\` exists.
- Existing useful components include analytics widgets and separate Beacon implementations, but several contain synthetic metrics. Reuse only after validating data contracts.
- No SQL migrations, Supabase policy definitions, or application authentication middleware appeared in the audited 65-file tree. **Absence from this repo does not prove absence in deployed DB or another repo.**

## Non-negotiable invariants

1. **Server-verified identity:** Never authorize based on client-supplied tenant, user, role, provider account, or localStorage.
2. **Effective tenant/client scope:** Resolve membership from verified server-side session and DB authorization. Any owner of an API URL should not gain access just by passing another client's ID.
3. **One client authority:** A DB-backed, authorized client read path; never import static fixtures as production tenants.
4. **Provider mapping is not metric certification.** Connection, resource discovery, mapping, ingestion, data validation, and certification are distinct states.
5. **No synthetic records in real workflows.** Missing/failed data is nullable and visibly unavailable, not zero.
6. **Historical preservation:** Do not drop rows, reassign tenant IDs, delete mappings, or rewrite existing history without approval and audit.
7. **No shared secrets in browser bundle.** Privileged service-role access only on separately authenticated server/internal jobs.
8. **No production writes/deploys without separate approval.** Implementation approval and release approval are different.

## Target authority flow (PROPOSED; contingent on DB/auth inspection)

Authenticated request -> verified session -> active tenant membership -> authorized client -> provider mapping -> provider adapter + sync run -> persisted facts + provenance -> certified metric -> client-scoped UI.

Client is manually created by an authorized tenant member; provider-resource discovery is automated but account mapping is explicitly selected/validated.

## Required external reconnaissance before implementation

Read-only evidence from deployed environment / authorized admin:

- Supabase Auth configuration and actual session propagation in this project.
- Actual table columns, foreign keys and RLS policies for clients, tenants/organizations, memberships, locations, external_accounts, account_mappings, metrics, ingestion_runs, signals, and data provenance.
- Privileged vs anonymous Supabase client construction; secret placement and exposure.
- Vercel deployed Git SHA, preview/production branch relationship, host-based auth and route logs.
- Render ETL ownership and relation to the Vercel cron, so competing pipelines are not created.
- Real customer records, fake fixtures and data ownership (inspect, do not delete).
- Existing provider authorization and credential owner; any other repos/services handling OAuth/sync.

## Known design unknowns / blockers

- Actual membership table name, tenancy schema, RLS coverage and current Auth provider are **unverified**.
- Public anonymous access might be deliberate for app shell, but customer metrics and writes must still be session-scoped.
- Column constraints for DB client creation/mapping cannot be assumed.
- Deployed commit may differ from inspected \`main\`.
- Whether existing clients in DB correspond to hardcoded names is unknown.

## Change register

| ID | Classification | Status | Implementation gate | Production gate |
| --- | --- | --- | --- | --- |
| CR-001 | High / Class C security | DESIGNED — approval pending | Auth/schema inspection + ADR approval | Separate release approval + audit/test proof |
| CR-002 | High / Class C data authority | DESIGNED — approval pending | Schema/RLS and CR-001 auth contract confirmed | Separate release approval + migration/rollback if needed |

## Release acceptance

- Anonymous client management and tenant-scoped read/write endpoints reject access without session (except explicitly approved public health).
- Authorized users see only allowed clients; unauthorized/mismatched tenant/client requests are forbidden.
- Tenant scope derived server-side; RLS verified with two test tenants and DB assertions.
- Client creation is persistent, validated, and not auto-seeded by provider discovery.
- Existing legitimate clients/mappings are preserved; static/demo data never appears as real.
- Navigation, direct route, loading/empty states and client switch are exercised in a browser.
- Verified real data and sync status are not inferred from certification flags.
- Test run, deployed commit, rollback evidence, and production owner signoff recorded.

**Architecture/change-control decision:** No DB/schema modification, automatic production deployment, credential modification, or merge is authorized by this baseline document.
