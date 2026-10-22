/**
 * CR-001: Framework-independent authorization decision policy.
 *
 * STATUS: PREPARATION ONLY — NOT CONNECTED TO ANY ROUTE.
 *
 * CRITICAL TRUST BOUNDARY:
 * - AuthenticatedPrincipal MUST come from a verified server-side session.
 * - VerifiedTenantMembership MUST come from a server-authorized membership lookup.
 * - ResolvedClientOwnership MUST come from a server-authorized database lookup.
 * - None of these values may be populated from request JSON, query parameters,
 *   localStorage, a hardcoded user registry, or a client-provided role.
 *
 * TypeScript types alone do not prove trust. Integration is blocked until the
 * existing Supabase Auth/session and database RLS contracts are verified.
 * This file has no imports or side effects and is intentionally unused.
 */

export type ProtectedOperation =
  | 'clients:read'
  | 'clients:create'
  | 'clients:update'
  | 'connections:read'
  | 'connections:write'
  | 'telemetry:read'
  | 'telemetry:write'
  | 'strategies:deploy';

export interface AuthenticatedPrincipal {
  readonly userId: string;
}

export interface VerifiedTenantMembership {
  readonly userId: string;
  readonly tenantId: string;
  readonly isActive: boolean;
  readonly permissions: readonly ProtectedOperation[];
}

export interface ResolvedClientOwnership {
  readonly clientId: string;
  readonly tenantId: string;
}

export type AuthorizationDecision =
  | {
      readonly allowed: true;
      readonly userId: string;
      readonly tenantId: string;
      readonly clientId?: string;
    }
  | {
      readonly allowed: false;
      readonly httpStatus: 401 | 403 | 404;
      readonly code: 'AUTH_REQUIRED' | 'FORBIDDEN' | 'CLIENT_NOT_FOUND';
    };

const AUTH_REQUIRED: AuthorizationDecision = {
  allowed: false,
  httpStatus: 401,
  code: 'AUTH_REQUIRED',
};

const FORBIDDEN: AuthorizationDecision = {
  allowed: false,
  httpStatus: 403,
  code: 'FORBIDDEN',
};

const CLIENT_NOT_FOUND: AuthorizationDecision = {
  allowed: false,
  httpStatus: 404,
  code: 'CLIENT_NOT_FOUND',
};

/**
 * Evaluate an authorized membership that the integration layer already verified.
 * This is NOT a session validator, DB authorization lookup, or replacement for RLS.
 */
export function evaluateTenantAccess(
  principal: AuthenticatedPrincipal | null,
  membership: VerifiedTenantMembership | null,
  operation: ProtectedOperation,
): AuthorizationDecision {
  if (!principal?.userId) return AUTH_REQUIRED;

  if (
    !membership ||
    !membership.isActive ||
    !membership.tenantId ||
    membership.userId !== principal.userId ||
    !membership.permissions.includes(operation)
  ) {
    return FORBIDDEN;
  }

  return {
    allowed: true,
    userId: principal.userId,
    tenantId: membership.tenantId,
  };
}

/**
 * Only a server-resolved client can be passed to this function.
 * No client-ID string supplied by a caller should be accepted as ownership proof.
 */
export function evaluateClientAccess(
  principal: AuthenticatedPrincipal | null,
  membership: VerifiedTenantMembership | null,
  client: ResolvedClientOwnership | null,
  operation: ProtectedOperation,
): AuthorizationDecision {
  const tenantDecision = evaluateTenantAccess(principal, membership, operation);
  if (!tenantDecision.allowed) return tenantDecision;

  if (!client?.clientId) return CLIENT_NOT_FOUND;

  if (client.tenantId !== tenantDecision.tenantId) return FORBIDDEN;

  return {
    allowed: true,
    userId: tenantDecision.userId,
    tenantId: tenantDecision.tenantId,
    clientId: client.clientId,
  };
}
