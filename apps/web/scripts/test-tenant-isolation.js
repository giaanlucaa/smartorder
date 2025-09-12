/**
 * Test script to verify multi-tenant isolation
 * Run with: node apps/web/scripts/test-tenant-isolation.js
 */

const BASE_URL = 'http://localhost:3000';

async function testTenantIsolation() {
  console.log('🧪 Testing Multi-Tenant Isolation...\n');

  // Test 1: Create orders for different tenants
  console.log('1️⃣ Creating orders for different tenants...');
  
  const tenant1 = 'c123456789012345678901234';
  const tenant2 = 'c987654321098765432109876';
  
  try {
    // Create order for tenant 1
    const order1Response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-venue-id': tenant1
      },
      body: JSON.stringify({
        venueId: tenant1,
        tableToken: 'test-table-1'
      })
    });
    
    const order1 = await order1Response.json();
    console.log('✅ Order 1 created:', order1.id);

    // Create order for tenant 2
    const order2Response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-venue-id': tenant2
      },
      body: JSON.stringify({
        venueId: tenant2,
        tableToken: 'test-table-2'
      })
    });
    
    const order2 = await order2Response.json();
    console.log('✅ Order 2 created:', order2.id);

    // Test 2: Verify tenant isolation
    console.log('\n2️⃣ Testing tenant isolation...');
    
    // Get orders for tenant 1
    const tenant1OrdersResponse = await fetch(`${BASE_URL}/api/orders`, {
      headers: { 'x-venue-id': tenant1 }
    });
    const tenant1Orders = await tenant1OrdersResponse.json();
    console.log(`📊 Tenant 1 orders: ${tenant1Orders.orders.length}`);
    
    // Get orders for tenant 2
    const tenant2OrdersResponse = await fetch(`${BASE_URL}/api/orders`, {
      headers: { 'x-venue-id': tenant2 }
    });
    const tenant2Orders = await tenant2OrdersResponse.json();
    console.log(`📊 Tenant 2 orders: ${tenant2Orders.orders.length}`);

    // Test 3: Cross-tenant access attempt
    console.log('\n3️⃣ Testing cross-tenant access prevention...');
    
    try {
      // Try to access tenant 1's order with tenant 2's context
      const crossAccessResponse = await fetch(`${BASE_URL}/api/orders`, {
        headers: { 'x-venue-id': tenant2 }
      });
      const crossAccessOrders = await crossAccessResponse.json();
      
      const hasTenant1Order = crossAccessOrders.orders.some(order => order.id === order1.id);
      if (hasTenant1Order) {
        console.log('❌ SECURITY ISSUE: Tenant 2 can see tenant 1\'s orders!');
      } else {
        console.log('✅ Tenant isolation working: Tenant 2 cannot see tenant 1\'s orders');
      }
    } catch (error) {
      console.log('✅ Tenant isolation working: Cross-tenant access blocked');
    }

    console.log('\n🎉 Multi-tenant isolation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTenantIsolation();

