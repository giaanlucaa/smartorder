/**
 * Tenant UI Configuration Loader
 * Loads UI settings for a specific tenant/venue with fallback to defaults
 */

import { prisma } from "@smartorder/db";
import { getUiFlagsForVenue, UiFlags } from "./uiSettings";

/**
 * Gets UI configuration for a specific venue
 * Always returns consistent UI flags, even for new tenants
 */
export async function getTenantUi(venueId: string): Promise<UiFlags> {
  if (!venueId) {
    // Return defaults if no venueId provided
    return getUiFlagsForVenue('', null);
  }

  try {
    // Load venue settings from database
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        // Support for individual boolean fields
        showBackToMenu: true,
        showForgotCta: true,
        showPaymentLoading: true,
        // Support for JSON config
        uiConfig: true,
      },
    });

    // Merge with defaults - this ensures all tenants have consistent behavior
    return getUiFlagsForVenue(venueId, venue);
  } catch (error) {
    console.warn(`Failed to load UI settings for venue ${venueId}:`, error);
    // Return defaults if database query fails
    return getUiFlagsForVenue(venueId, null);
  }
}

/**
 * Client-side version that works with venue data already loaded
 * Useful for client components that already have venue information
 */
export function getTenantUiFromData(venueData?: any): UiFlags {
  return getUiFlagsForVenue('', venueData);
}
