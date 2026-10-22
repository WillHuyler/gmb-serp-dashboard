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

export interface AuthDecision {
  allowed: boolean;
  status: 200 | 401 | 403 | 404;
  effectiveTenantId: string;
  code?: string;
  message?: string;
}

export function evaluateTenantAccess(
  user: VerifiedUserContext | null,
  requestedTenantId?: string | null
): AuthDecision {
  if (!user || !user.userId) {
    return { allowed: false, status: 401, effectiveTenantId: '', code: 'UNAUTHENTICATED', message: 'Authentication required.' };
  }
  if (user.isSuperAdmin) {
    const t = requestedTenantId || user.authorizedTenantIds[0] || '';
    if (!t) return { allowed: false, status: 403, effectiveTenantId: '', code: 'NO_TENANT_CONTEXT', message: 'No tenant context.' };
    return { allowed: true, status: 200, effectiveTenantId: t };
  }
  if (!user.authorizedTenantIds?.length) {
    return { allowed: false, status: 403, effectiveTenantId: '', code: 'NO_TENANT_MEMBERSHIP', message: 'No tenant membership.' };
  }
  if (requestedTenantId) {
    if (!user.authorizedTenantIds.includes(requestedTenantId)) {
      return { allowed: false, status: 403, effectiveTenantId: '', code: 'FORBIDDEN_TENANT_ACCESS', message: 'Forbidden tenant.' };
    }
    return { allowed: true, status: 200, effectiveTenantId: requestedTenantId };
  }
  return { allowed: true, status: 200, effectiveTenantId: user.authorizedTenantIds[0] };
}

export function evaluateClientAccessPolicy(
  user: VerifiedUserContext | null,
  clientRecord: ClientOwnershipRecord | null,
  requestedTenantId?: string | null
): AuthDecision {
  if (!user || !user.userId) {
    return { allowed: false, status: 401, effectiveTenantId: '', code: 'UNAUTHENTICATED', message: 'Authentication required.' };
  }
  if (!clientRecord) {
    return { allowed: false, status: 403, effectiveTenantId: '', code: 'CLIENT_NOT_FOUND_OR_FORBIDDEN', message: 'Forbidden client.' };
  }
  if (requestedTenantId && requestedTenantId !== clientRecord.tenant_id) {
    return { allowed: false, status: 403, effectiveTenantId: '', code: 'TENANT_CLIENT_MISMATCH', message: 'Tenant mismatch.' };
  }
  if (user.isSuperAdmin || user.authorizedTenantIds.includes(clientRecord.tenant_id)) {
    return { allowed: true, status: 200, effectiveTenantId: clientRecord.tenant_id };
  }
  return { allowed: false, status: 403, effectiveTenantId: '', code: 'CROSS_TENANT_ACCESS_DENIED', message: 'Cross-tenant access denied.' };
}
// EOF
