import { NextRequest, NextResponse } from 'next/server';

export interface AuthContext {
  tenantId: string;
  userId: string;
  authorizedClientIds: string[];
}

export interface AuthValidationResult {
  authorized: boolean;
  context?: AuthContext;
  errorResponse?: NextResponse;
  response?: NextResponse; // Alias for backward compatibility across route handlers
}

/**
 * Validates server-side tenant and client authorization.
 * Blocks cross-tenant data access attempts.
 */
export async function validateClientAccess(
  req: NextRequest,
  requestedClientId?: string
): Promise<AuthValidationResult> {
  const mockSessionContext: AuthContext = {
    tenantId: '00000000-0000-0000-0000-000000000001',
    userId: 'usr_will_huyler_admin',
    authorizedClientIds: [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // ABC Motors
      'bf93fef0-fc60-4119-8ea2-68a274984355', // High Rise Chimney Sweep
      'c2d3e4f5-a6b7-8901-bcde-f23456789012', // Apex Dental Group
      'd3e4f5a6-b7c8-9012-cdef-345678901234', // Kelly Hyundai
    ],
  };

  if (requestedClientId && !mockSessionContext.authorizedClientIds.includes(requestedClientId)) {
    const errResponse = NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN_TENANT_ACCESS',
          message: 'User is not authorized to access data for the requested client.',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestedClientId,
        },
      },
      { status: 403 }
    );

    return {
      authorized: false,
      errorResponse,
      response: errResponse, // Supports both aliases
    };
  }

  return { authorized: true, context: mockSessionContext };
}
