# ADR-001 — Server-verified identity and a single client authority

**Status:** PROPOSED / NOT APPROVED  
**Date:** 2026-10-21  
**Links:** AB-001, CR-001, CR-002

## Context

Production UI currently mounts a hardcoded client registry; another DB-backed client-provider exists but is not the active root provider. The server authorization helper uses fixed mock identity and a list of client IDs. Several endpoints accept caller-supplied tenant/client identifiers, and some run privileged operations without a verified application session.

The current Supabase auth, tenant-membership and RLS schema has not been inspected. No credible schema migration can be authored from the repository alone.

## Decision proposal

1. Adopt a single server-authoritative, DB-backed client access contract, based on real authenticated user sessions. If existing app auth is Supabase Auth, use verified server-side \`getUser()\` with cookie-aware server clients; if another auth provider is already deployed, reuse it instead. Never use a client-side fake token or a hardcoded member list.
2. Load allowed clients by the verified user's tenant membership. Select active client only from that allowed list. A query/localStorage clientId is preference only, not permission.
3. Consolidate context toward one client provider consumed from root layout, keeping compatibility with current \`useClient\` API during migration; retire competing implementations only after tests. Do not introduce a new authoritative client table until existing DB is inspected.
4. Separate client metadata from provider resource mappings and certification. Only verified provider ingestion may mark metric readiness; never on mapping insert alone.
5. Keep privileged sync/admin operations behind authenticated server endpoints; use service-role keys only after explicit authorization, never for public arbitrary client IDs.
6. Preserve existing valid DB rows/mappings and disallow fixtures from production by design. Dedicated synthetic/demo mode must be explicitly marked and isolated.

## Alternatives considered

- **Retain source-code registry as the production source:** rejected — impossible to safely onboard and update clients, weak tenant authority.
- **Mount the existing DB-backed provider as-is:** rejected — contains unauthenticated direct fallback queries and no reliable tenant authorization.
- **Add a parallel client table/service:** rejected — duplicate source of truth and migration risk.
- **Switch the entire platform to a new auth stack immediately:** rejected unless evidence establishes current provider is unusable.

## Compatibility and rollout

- Phase 0: Read-only auth/schema/permission inspection and deployment identity confirmation.
- Phase 1 (CR-001): Verify session on every sensitive endpoint, derive tenant/server principal, enforce membership and deny unauthenticated/unauthorized access; add negative-path tests and record any route visibility changes.
- Phase 2 (CR-002): Make client list/selection derive from the verified server API; implement Add Client via authorized POST based on inspected schema and DB constraints; preserve existing mappings and show truthful empty state.
- Phase 3: Remove static production registry and duplicate provider after client-switch and cross-tenant regression tests; separate approved deploy after signoff.

## Risks and mitigations

- Existing public browsers may be using unauthenticated mock sessions: stage any auth change, test expected sign-in path, and secure backend writes before broad UX releases.
- Existing DB records may not match hardcoded IDs: inventory and reconcile without deletion or reassignment.
- Missing migrations/RLS knowledge: block runtime change until reviewed.
- Auth provider choice uncertain: defer package selection until deployment identity confirmed.
- Session refresh and cache leakage: test under two real users, different tenants, logout, expired cookie, mismatched query parameter, concurrent switching.

## Reversibility

No destructive migrations by default. Deploy change in small commits; rollback application revision only if authorization boundaries stay secure. Do not turn off RLS or reinstate mock authorization to recover a broken UI. If the new login route misbehaves, retain a safe access-denied state until corrected.

## Decision required

Owner approves ADR after reviewing verified DB schema and chosen existing auth mechanism. This is an engineering proposal, not an implemented or production-certified architecture.
