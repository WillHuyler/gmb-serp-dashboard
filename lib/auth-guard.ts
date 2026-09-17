import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedContext {
  userId: string;
  tenantId: string;
  authorizedClientIds: string[];
}

/**
 * Validates that the requested clientId belongs to the authenticated tenant.
 * Server-side enforcement for all API routes.
 */
export async function validateClientAccess(
  req: NextRequest,
  requestedClientId: string | null
): Promise<{ authorized: boolean; response?: NextResponse; context?: AuthenticatedContext }> {
  if (!requestedClientId) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_CLIENT_ID', message: 'Target client ID is required.' },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      ),
    };
  }

  // TODO: Extract token/session from Supabase auth header
  // Simulated server session verification against tenant context
  const mockTenantContext: AuthenticatedContext = {
    userId: 'usr_admin_001',
    tenantId: '00000000-0000-0000-0000-000000000001',
    authorizedClientIds: [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'bf93fef0-fc60-4119-8ea2-68a274984355',
      'c2d3e4f5-a6b7-8901-bcde-f23456789012',
    ],
  };

  const isAuthorized = mockTenantContext.authorizedClientIds.includes(requestedClientId);

  if (!isAuthorized) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED_CLIENT_ACCESS',
            message: 'Cross-tenant access violation. Requested client does not belong to your tenant scope.',
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, context: mockTenantContext };
}
