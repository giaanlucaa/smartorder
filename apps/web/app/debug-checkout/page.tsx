'use client';
import { useState } from 'react';

export default function DebugCheckout() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      const data = await response.json();
      setResult({ success: true, data });
    } catch (error) {
      setResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  const testOrdersAPI = async () => {
    setLoading(true);
    try {
      // Test with one of the new QR tokens
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venueId: 'clx1234567890', // This might be wrong
          tableToken: 't1757364858710_spcrbuvr' // One of the new QR tokens
        })
      });
      const data = await response.json();
      setResult({ success: true, data, status: response.status });
    } catch (error) {
      setResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  const testVenueAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/venue/public', {
        method: 'GET'
      });
      const data = await response.json();
      setResult({ success: true, data, status: response.status });
    } catch (error) {
      setResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Debug Checkout System</h1>
      
      <div className="space-y-4">
        <button
          onClick={testAPI}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test API
        </button>
        
        <button
          onClick={testOrdersAPI}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Orders API
        </button>
        
        <button
          onClick={testVenueAPI}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Test Venue API
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
