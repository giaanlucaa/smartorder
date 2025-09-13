# Tenant Switching Guide

This guide explains how to use the new tenant switching functionality in SmartOrder.

## Overview

The tenant switching system allows administrators to switch between different venues (tenants) without logging out. This is essential for multi-tenant setups where one admin manages multiple restaurants.

## How It Works

1. **Middleware**: The `middleware.ts` file automatically adds the `x-venue-id` header to all admin/kitchen/API requests based on the `adminVenueId` cookie.

2. **Cookie-based Switching**: The `/api/admin/tenant/switch` endpoint sets a cookie that persists the selected tenant.

3. **API Filtering**: All admin and kitchen APIs now respect the tenant context and only show data for the selected venue.

## Usage

### 1. Automatic UI Switching (Recommended)

If you have multiple venues, a dropdown will appear in the admin dashboard header:

1. Go to `/admin`
2. Look for the venue dropdown in the top-right corner
3. Select a different venue from the dropdown
4. The page will reload with the new tenant context

### 2. Manual API Switching

You can also switch tenants programmatically:

```bash
curl -X POST http://localhost:3000/api/admin/tenant/switch \
  -H "Content-Type: application/json" \
  -d '{"venueId":"<YOUR_VENUE_ID>"}'
```

### 3. Test Script

Use the provided test script:

```bash
node apps/web/scripts/test-tenant-switch.js <venueId>
```

## What Gets Switched

When you switch tenants, the following areas will show data for the new venue:

- **Admin Dashboard** (`/admin`) - All management functions
- **Kitchen Display** (`/kitchen`) - Order management
- **Accounting** (`/admin/accounting`) - Financial reports
- **All API endpoints** - Data filtering

## Troubleshooting

### Problem: "0 Ergebnisse" (No Results)

**Cause**: No tenant context is set after a reset.

**Solution**: 
1. Use the tenant switcher in the admin dashboard, or
2. Run the test script with a valid venue ID

### Problem: Kitchen Shows No Orders

**Cause**: Orders might be in PAID status but kitchen only shows OPEN/CONFIRMED.

**Solution**: The new kitchen API now includes PAID orders. If you still don't see orders:
1. Check the browser console for tenant ID logs
2. Verify the venue ID is correct
3. Check the database for orders with the correct venue_id

### Problem: Accounting Shows No Data

**Cause**: No payments were created during test checkout.

**Solution**: Ensure your test payment flow creates Payment records with status 'SETTLED'.

## Technical Details

### Files Modified/Created

- `apps/web/middleware.ts` - Sets x-venue-id header from cookie
- `apps/web/app/admin/tenant/switch/route.ts` - Tenant switching endpoint
- `apps/web/app/api/kitchen/orders/route.ts` - Kitchen-specific orders API
- `apps/web/app/api/admin/venues/route.ts` - Get all venues for user
- `apps/web/app/admin/page.tsx` - Added tenant switcher UI
- `apps/web/scripts/test-tenant-switch.js` - Test script

### Database Queries

The system now uses tenant-aware Prisma clients that automatically filter by venue ID:

```typescript
const tenantDb = prismaForTenant(tenantId);
const orders = await tenantDb.order.findMany({
  where: { status: { in: ['OPEN', 'CONFIRMED', 'PAID'] } }
});
```

### Status Filtering

Kitchen and accounting now show orders with these statuses:
- `OPEN` - New orders
- `CONFIRMED` - Confirmed orders  
- `PAID` - Paid orders (newly added)

## Testing

1. **Create Test Data**: Make sure you have orders in different venues
2. **Switch Tenants**: Use the UI or API to switch between venues
3. **Verify Data**: Check that kitchen/accounting show the correct venue's data
4. **Check Logs**: Look for tenant ID logs in the browser console

## Security Notes

- The `adminVenueId` cookie is httpOnly and secure
- Tenant switching requires authentication
- All API endpoints validate tenant context
- Users can only access venues they have permissions for

## Future Improvements

- Automatic tenant detection based on user permissions
- Tenant context persistence across browser sessions
- Bulk operations across multiple tenants
- Tenant-specific UI themes and branding
