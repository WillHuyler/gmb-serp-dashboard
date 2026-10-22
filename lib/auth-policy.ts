export interface VerifiedUserContext {
  userId: string;
  email?: string | null;
  isSuperAdmin: boolean;
  authorizedTenantIds: string[];
}

export interface ClientOwnershipRecord {
  id: string;
  tenant_id: string;
}

export type AuthDecision =
  | { allowed: true; status: 200; effectiveTenantId: string }
  | { allowed: false; status: 401 | 403 | 404; code: string; message: string };

/**
 * Pure policy evaluation for tenant-level access.
 * Never trusts caller-supplied tenantId unless the authenticated user belongs to that tenant
 * or is a verified platform super-admin.
 */
export function evaluateTenantAccess(
  user: VerifiedUserContext | null,
  requestedTenantId?: string | null
): AuthDecision {
  if (!user || !user.userId) {
    return {
      allowed: false,
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Valid authentication session required.',
    };
  }

  if (user.isSuperAdmin) {
    const targetTenant =
      requestedTenantId || user.authorizedTenantIds[0] || '';
    if (!targetTenant) {
      return {
        allowed: false,
        status: 403,
        code: 'NO_TENANT_CONTEXT',
        message: 'No authorized tenant context available.',
      };
    }
    return { allowed: true, status: 200, effectiveTenantId: targetTenant };
  }

  if (!user.authorizedTenantIds || user.authorizedTenantIds.length === 0) {
    return {
      allowed: false,
      status: 403,
      code: 'NO_TENANT_MEMBERSHIP',
      message: 'Authenticated user has no active tenant memberships.',
    };
  }

  if (requestedTenantId) {
    if (!user.authorizedTenantIds.includes(requestedTenantId)) {
      return {
        allowed: false,
        status: 403,
        code: 'FORBIDDEN_TENANT_ACCESS',
        message: 'Access to the requested tenant is forbidden.',
      };
    }
    return { allowed: true, status: 200, effectiveTenantId: requestedTenantId };
  }

  return {
    allowed: true,
    status: 200,
    effectiveTenantId: user.authorizedTenantIds[0],
  };
}

/**
 * Pure policy evaluation for client-level access.
 * Never trusts caller-supplied clientId as proof of authorization.
 */
export function evaluateClientAccessPolicy(
  user: VerifiedUserContext | null,
  clientRecord: ClientOwnershipRecord | null,
  requestedTenantId?: string | null
): AuthDecision {
  if (!user || !user.userId) {
    return {
      allowed: false,
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Valid authentication session required.',
    };
  }

  if (!clientRecord) {
    return {
      allowed: false,
      status: 403,
      code: 'CLIENT_NOT_FOUND_OR_FORBIDDEN',
      message: 'Requested client does not exist or access is forbidden.',
    };
  }

  if (requestedTenantId && requestedTenantId !== clientRecord.tenant_id) {
    return {
      allowed: false,
      status: 403,
      code: 'TENANT_CLIENT_MISMATCH',
      message: 'Client does not belong to the specified tenant.',
    };
  }

  if (user.isSuperAdmin) {
    return {
      allowed: true,
      status: 200,
      effectiveTenantId: clientRecord.tenant_id,
    };
  }

  if (!user.authorizedTenantIds.includes(clientRecord.tenant_id)) {
    return {
      allowed: false,
      status: 403,
      code: 'CROSS_TENANT_ACCESS_DENIED',
      message: 'User is not authorized for the tenant owning this client.',
    };
  }

  return {
    allowed: true,
    status: 200,
    effectiveTenantId: clientRecord.tenant_id,
  };
}
