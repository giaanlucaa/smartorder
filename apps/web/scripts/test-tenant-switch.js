#!/usr/bin/env node

/**
 * Test script for tenant switching functionality
 * Usage: node scripts/test-tenant-switch.js <venueId>
 */

const venueId = process.argv[2];

if (!venueId) {
  console.error('Usage: node scripts/test-tenant-switch.js <venueId>');
  console.error('Example: node scripts/test-tenant-switch.js c123456789012345678901234');
  process.exit(1);
}

async function testTenantSwitch() {
  try {
    console.log(`🔄 Switching to tenant: ${venueId}`);
    
    const response = await fetch('http://localhost:3000/api/admin/tenant/switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ venueId }),
    });

    if (response.ok) {
      console.log('✅ Tenant switch successful!');
      console.log('📝 Cookie set: adminVenueId=' + venueId);
      console.log('🔄 Please reload your admin/kitchen pages to see the new tenant data');
    } else {
      const error = await response.text();
      console.error('❌ Tenant switch failed:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTenantSwitch();
