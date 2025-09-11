import { SessionData } from './index';

export interface TenantContext {
  venueId: string;
  userRole: string;
  userId: string;
}

export function createTenantContext(session: SessionData): TenantContext {
  return {
    venueId: session.venueId,
    userRole: session.user.role,
    userId: session.user.id,
  };
}

export function requireVenueAccess(tenantContext: TenantContext, targetVenueId: string): void {
  if (tenantContext.venueId !== targetVenueId) {
    throw new Error('Access denied: Venue mismatch');
  }
}

export function createVenueScopedQuery(tenantContext: TenantContext, baseQuery: any = {}) {
  return {
    ...baseQuery,
    where: {
      ...baseQuery.where,
      venueId: tenantContext.venueId,
    },
  };
}

export function createVenueScopedCreate(tenantContext: TenantContext, data: any) {
  return {
    ...data,
    venueId: tenantContext.venueId,
  };
}

// Helper for admin API routes
export async function withTenantIsolation<T>(
  session: SessionData,
  operation: (tenantContext: TenantContext) => Promise<T>
): Promise<T> {
  const tenantContext = createTenantContext(session);
  return await operation(tenantContext);
}
