/**
 * Multi-Tenant Helper Functions
 * Extracts venueId/tenantId from various request sources
 */

export function getTenantIdFromRequest(req: Request): string | null {
  const url = new URL(req.url);
  
  // 1) Route pattern: /t/{venueId}/... (Guest flow)
  const parts = url.pathname.split('/').filter(Boolean);
  const tIndex = parts.indexOf('t');
  if (tIndex >= 0 && parts[tIndex + 1]) {
    return parts[tIndex + 1];
  }

  // 2) Header: x-venue-id (Admin/API)
  const headerVenueId = req.headers.get('x-venue-id');
  if (headerVenueId) {
    return headerVenueId;
  }

  // 3) Query parameter: ?venueId=... (Fallback)
  const queryVenueId = url.searchParams.get('venueId');
  if (queryVenueId) {
    return queryVenueId;
  }

  return null;
}

export function getTenantIdFromUrl(url: string): string | null {
  const urlObj = new URL(url);
  const parts = urlObj.pathname.split('/').filter(Boolean);
  const tIndex = parts.indexOf('t');
  if (tIndex >= 0 && parts[tIndex + 1]) {
    return parts[tIndex + 1];
  }
  return null;
}

export function getTenantIdFromPathname(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const tIndex = parts.indexOf('t');
  if (tIndex >= 0 && parts[tIndex + 1]) {
    return parts[tIndex + 1];
  }
  return null;
}

/**
 * Validates that a tenantId is properly formatted (CUID)
 */
export function isValidTenantId(tenantId: string | null): boolean {
  if (!tenantId) return false;
  // CUID format: starts with 'c' followed by 24 characters
  return /^c[a-z0-9]{24}$/.test(tenantId);
}

/**
 * Middleware helper to ensure tenant context
 */
export function requireTenant(req: Request): string {
  const tenantId = getTenantIdFromRequest(req);
  if (!tenantId || !isValidTenantId(tenantId)) {
    throw new Error('Missing or invalid tenant ID');
  }
  return tenantId;
}

