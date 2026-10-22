# CR-002 — Replace source-code client registry with manual tenant-scoped onboarding

**Priority:** P0 critical  
**Risk:** Class C — tenant/client data authority and UI state  
**Status:** DESIGNED, NOT IMPLEMENTED  
**Owner approvals:** Implementation PENDING; production release PENDING  
**Depends on:** AB-001; ADR-001; CR-001 principal+tenant contract; existing DB schema and RLS verified.

## Verified defect

\`app/layout.tsx\` mounts the \`lib/client-context.tsx\` provider, which exposes six source-code-defined client records and uses ABC Motors as the default. High Rise has Wisconsin ZIPs in the hardcoded registry. The additional component \`components/providers/client-provider.tsx\` fetches DB clients but is not mounted at root and falls back to browser-side direct DB reads. The \`/api/clients\` route only supports GET, and no \`app/clients/page.tsx\` exists. Sidebar renamed Clients to Connection Center.

## Architectural decision

- Existing authorized DB client records are the only production client authority.
- Create ONE client manually via privileged Add Client form. No automatic client creation from Google/Meta/BrightLocal account discovery.
- Provider resource discovery is a separate operation; explicit verified mapping follows.
- Client state: no client, client created, connected/unmapped, mapping pending, syncing, ready/stale/failed — do not collapse these into \`is_certified\`.
- Avoid physically deleting hardcoded fixture content until all consumers migrate; first ensure it is never read as production clients. Fixtures remain isolated and unmistakably labeled demo.
- Preserve every legitimate historical client and provider mapping after reconciliation; investigate suspicious ZIP data without bulk reassignment.

## Proposed API contracts (DB schema dependent)

- GET \`/api/clients\`: tenant-authorized list, paginated/searchable; no fallback to source constants; 401/403 for unauthorized.
- POST \`/api/clients\`: authorized create with validated business name/domain/location; tenant_id always server-derived; response 201 with persisted ID; duplicate policy based on actual DB uniqueness.
- GET/PATCH \`/api/clients/:id\`: authorized detail/update with optimistic concurrency or equivalent; scope every query to principal tenant.
- GET \`/api/clients/:id/connections\`: authorized mapping/readiness summary grounded in DB; do not infer readiness from presence of ID string.
- Frontend \`useClient\`: one provider with clients, activeClient, status and error; selected client taken from authorized list. URL/localStorage only preserve selection preference.
- UI: \`/clients\` portfolio/list/create, direct navigation, Add Client wizard, empty state with a single primary CTA; client selection persists and updates all connected sections.

## Implementation work packages

- **CR-002A:** Introduce server-typed client read API and authorized client list; no mutation.
- **CR-002B:** Add client creation/update once reviewed schema and constraints are available.
- **CR-002C:** Consolidate root client context and sidebar, preserving existing \`useClient\` interface where possible and fixing duplicate global headers.
- **CR-002D:** Add client-specific integration mapping and data-health links; ensure switching does not leak cached data.

## Acceptance tests

1. Empty tenant shows no fake client; Add Client is visible.
2. Authorized user can create ONE real client, reload and see persistent record and stable ID.
3. Unauthorized user cannot create, edit, list or select another tenant's client.
4. URL containing another tenant clientId cannot activate it.
5. Client created without connections has zero certified metrics; dashboards show unavailable, not invented zero.
6. Existing legitimate DB clients and mappings remain unchanged.
7. Selected client switching propagates to every route and request; stale cache results never display for new client.
8. Provider discovery does not create clients or mappings without approval.
9. Multi-location clients use explicit location records/IDs and real service areas; no hardcoded Wisconsin/Pennsylvania overlap.
10. Browser tests at desktop/tablet verify sidebar and header consistency.

## DB discovery required before code

Inspect table names/columns/foreign keys, uniqueness, RLS, existing migrations and any trigger behavior. Specifically confirm the relationship of \`clients\`, organizations/tenants, memberships, \`account_mappings\`, \`external_accounts\`, service areas/locations, and default certification fields.

## Rollback

Code-only revert of client UI/read path if necessary, while preserving DB rows created during an approved test. No destructive migration, no invented client fallback, and no unauthorized exposure on rollback.

## Exclusions

No automatic bulk import, no production schema alteration or data deletion, no fake certified clients, no production deployment before separate owner approval.
