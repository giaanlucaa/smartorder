'use client';
import { useState } from 'react';

export default function TestOrderPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCompleteOrderFlow = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing complete order flow...');

      // Step 1: Create order
      console.log('1️⃣ Creating order...');
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venueId: 'clx1234567890', // This might be wrong - we need real venue ID
          tableToken: 't1757364858710_spcrbuvr' // One of the new QR tokens
        })
      });

      if (!orderRes.ok) {
        const errorText = await orderRes.text();
        throw new Error(`Order creation failed: ${orderRes.status} - ${errorText}`);
      }

      const order = await orderRes.json();
      console.log('✅ Order created:', order);

      // Step 2: Add item to order
      console.log('2️⃣ Adding item to order...');
      const itemRes = await fetch(`/api/orders/${order.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: 'test-item-id', // This might be wrong - we need real item ID
          qty: 1,
          modifiers: {}
        })
      });

      if (!itemRes.ok) {
        const errorText = await itemRes.text();
        throw new Error(`Item addition failed: ${itemRes.status} - ${errorText}`);
      }

      console.log('✅ Item added to order');

      // Step 3: Mark as paid
      console.log('3️⃣ Marking order as paid...');
      const paymentRes = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: 'direct'
        })
      });

      if (!paymentRes.ok) {
        const errorText = await paymentRes.text();
        throw new Error(`Payment failed: ${paymentRes.status} - ${errorText}`);
      }

      const payment = await paymentRes.json();
      console.log('✅ Payment processed:', payment);

      // Step 4: Check if order appears in kitchen
      console.log('4️⃣ Checking kitchen orders...');
      const kitchenRes = await fetch('/api/orders');
      const kitchenData = await kitchenRes.json();
      
      const orderInKitchen = kitchenData.orders.find((o: any) => o.id === order.id);
      
      setResult({
        success: true,
        order: order,
        payment: payment,
        orderInKitchen: orderInKitchen ? 'YES' : 'NO',
        totalOrders: kitchenData.orders.length
      });

    } catch (error) {
      console.error('❌ Test failed:', error);
      setResult({
        success: false,
        error: error.message
      });
    }
    setLoading(false);
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Test Complete Order Flow</h1>
      
      <div className="space-y-4">
        <button
          onClick={testCompleteOrderFlow}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Complete Order Flow'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Test Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Kitchen Dashboard:</h3>
        <a 
          href="/kitchen" 
          target="_blank"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Open Kitchen Dashboard in new tab
        </a>
      </div>
    </main>
  );
}
