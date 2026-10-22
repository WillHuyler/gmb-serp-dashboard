# CR-001 — Replace mock authentication and enforce server-side tenant isolation

**Priority:** P0 critical  
**Risk:** Class C — authentication / customer isolation  
**Status:** DESIGNED, NOT IMPLEMENTED  
**Owner approvals:** Implementation PENDING; production release PENDING  
**Depends on:** AB-001; ADR-001; live auth/RLS/schema audit.

## Verified defect

\`lib/auth-guard.ts\` hardcodes tenant \`00000000-0000-0000-0000-000000000001\`, fake user \`usr_will_huyler_admin\`, and a static client allow-list. Unrecognized callers can be treated as this fixed principal. Several endpoints lack request-scoped principal checks and trust submitted tenant/client IDs.

Affected starting inventory (not exhaustive):
- \`lib/auth-guard.ts\`
- \`app/api/clients/route.ts\`
- \`app/api/data/inventory/route.ts\`
- \`app/api/data/mappings/route.ts\`
- \`app/api/integrations/sync/route.ts\`
- \`app/api/telemetry/*/route.ts\`
- \`app/api/outcome-lab/deploy/route.ts\`
- \`app/api/beacon/evaluate/route.ts\`
- \`app/api/ai/recommendations/route.ts\`
- \`app/api/cron/daily-etl/route.ts\` (service-to-service token)
- \`app/api/auth/[provider]/route.ts\` (OAuth session/state/token controls).

## Proposed design / contract

- \`requirePrincipal(request)\` validates the actual session with the existing authorized IdP, returns a typed principal or 401; no mock fallback.
- \`requireClientAccess(principal, clientId, operation)\` checks active tenant membership, client ownership and role permissions by server-side DB queries/RLS; returns 403 for disallowed client.
- \`requireTenantAdmin(principal, tenantId)\` for onboarding, mapping changes and privileged operations.
- Derive tenant/user identifiers from principal and membership, NEVER the JSON body.
- Validate inputs (UUIDs, provider enums, resource identities, date windows) on server.
- For service-role DB clients, require principal authorization before touching any tenant data. Do not pass service role or stored provider tokens to browser.
- Internal scheduled jobs require a separately verified secret plus job-specific resource scope, no anonymous invocation.
- OAuth requires CSRF state binding, code exchange, scoped encrypted storage, refresh and revocation; complete in a separately reviewed provider change package.

## Suggested protected handler flow

1. Parse/validate request shape without trusting client ownership claims.
2. Verify request identity. If missing/invalid: 401.
3. Resolve membership and client authorization from DB. If mismatched: 403 or deliberately opaque 404.
4. Resolve provider resource mapping by client + tenant + provider; reject inappropriate cross-client mapping.
5. Perform only the authorized operation with scoped DB access; audit the action and errors.
6. Return a typed result with no service secrets or raw credential values.

## Acceptance tests (new automated suite required)

- Anonymous GET /api/clients and POST /api/data/mappings rejected.
- Forged body tenantId, userId, or user role does not expand access.
- Real user A can access own client; cannot see user B's client from another tenant.
- User B cannot request client A by guessing a UUID (read or write).
- Basic/public health endpoint remains appropriately sanitized.
- Expired/invalid sessions reject access.
- Privileged access requires appropriate role; unauthorized users cannot certify a mapping or deploy strategy.
- Missing Supabase env vars fail closed; never fall back to another tenant or anon key for privileged operations.
- CSRF/redirect validation for provider callback; never acknowledge mock OAuth completion as success.

## Change plan

1. Inspect deployed auth mechanism and Supabase membership/RLS policy definitions (read-only).
2. Choose minimal compatibility design: existing IdP first.
3. Add session-aware server authorization utility and negative-path tests in isolated CR-001 branch/PR.
4. Apply to sensitive routes in small commits; log intentional API contract changes.
5. Stage with two isolated test tenants and real provider mapping fixture (no real client data mutated).
6. Request distinct owner implementation, then release, approvals.
7. Deploy only after CI/browser checks and postdeploy negative-path verification.

## Rollback

Restore prior app revision only if it does not reopen unauthorized access; do not re-enable mock auth or disable RLS. Protect affected endpoints with fail-closed error status while repairing.

## Exclusions

No production RLS edits, DB migration, credential rotation, client deletion, mass ingestion or live release in this design phase.
