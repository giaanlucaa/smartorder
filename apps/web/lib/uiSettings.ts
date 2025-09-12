/**
 * Centralized UI Settings with Defaults
 * Ensures all tenants have consistent UI behavior
 */

export type UiFlags = {
  showBackToMenuDuringPayment: boolean;
  showForgotSomethingAfterOrder: boolean;
  showPaymentLoadingState: boolean;
};

export const DEFAULT_UI_FLAGS: UiFlags = {
  showBackToMenuDuringPayment: true,
  showForgotSomethingAfterOrder: true,
  showPaymentLoadingState: true,
};

/**
 * Merges venue-specific UI settings with defaults
 * Always ensures consistent behavior across all tenants
 */
export function mergeUiFlags(venueSettings?: Partial<UiFlags> | null): UiFlags {
  return { ...DEFAULT_UI_FLAGS, ...(venueSettings ?? {}) };
}

/**
 * Gets UI flags for a specific venue
 * Falls back to defaults if venue settings are missing
 */
export function getUiFlagsForVenue(venueId: string, venueSettings?: any): UiFlags {
  // Extract UI settings from venue data (supports both boolean fields and JSON config)
  const partial: Partial<UiFlags> = {};
  
  if (venueSettings) {
    // Support for individual boolean fields
    if (typeof venueSettings.showBackToMenu === 'boolean') {
      partial.showBackToMenuDuringPayment = venueSettings.showBackToMenu;
    }
    if (typeof venueSettings.showForgotCta === 'boolean') {
      partial.showForgotSomethingAfterOrder = venueSettings.showForgotCta;
    }
    if (typeof venueSettings.showPaymentLoading === 'boolean') {
      partial.showPaymentLoadingState = venueSettings.showPaymentLoading;
    }
    
    // Support for JSON config object
    if (venueSettings.uiConfig && typeof venueSettings.uiConfig === 'object') {
      const config = venueSettings.uiConfig;
      if (typeof config.showBackToMenuDuringPayment === 'boolean') {
        partial.showBackToMenuDuringPayment = config.showBackToMenuDuringPayment;
      }
      if (typeof config.showForgotSomethingAfterOrder === 'boolean') {
        partial.showForgotSomethingAfterOrder = config.showForgotSomethingAfterOrder;
      }
      if (typeof config.showPaymentLoadingState === 'boolean') {
        partial.showPaymentLoadingState = config.showPaymentLoadingState;
      }
    }
  }
  
  return mergeUiFlags(partial);
}
