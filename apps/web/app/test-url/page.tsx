'use client';
import { useState } from 'react';

export default function TestUrlPage() {
  const [testUrl, setTestUrl] = useState('');
  const [result, setResult] = useState<any>(null);

  const testCheckoutUrl = async () => {
    try {
      // Get real Tisch 1 URL
      const response = await fetch('/api/real-urls');
      const data = await response.json();
      
      if (!data.tisch1) {
        alert('Tisch 1 nicht gefunden!');
        return;
      }

      const cart = [
        {
          itemId: 'item-1',
          name: 'Test Pizza',
          price: 15.50,
          qty: 2,
          modifiers: {},
          totalPrice: 31.00
        }
      ];

      const cartData = encodeURIComponent(JSON.stringify(cart));
      const url = `/checkout?venueId=${data.tisch1.venueId}&tableToken=${data.tisch1.qrToken}&cart=${cartData}`;
      
      setTestUrl(url);
      setResult({
        venueId: data.tisch1.venueId,
        tableToken: data.tisch1.qrToken,
        cart,
        encodedCart: cartData,
        fullUrl: url,
        tisch1Info: data.tisch1
      });
    } catch (error) {
      console.error('Error getting real URL:', error);
      alert('Fehler beim Laden der echten URL');
    }
  };

  const openTestUrl = () => {
    if (testUrl) {
      window.open(testUrl, '_blank');
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Test Checkout URL - Tisch 1</h1>
      
      <div className="space-y-4">
        <button
          onClick={testCheckoutUrl}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Generate Real Tisch 1 URL
        </button>
        
        {testUrl && (
          <button
            onClick={openTestUrl}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Open Test URL
          </button>
        )}
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-semibold mb-2">Generated URL:</h2>
            <p className="text-sm break-all">{result.fullUrl}</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded">
            <h2 className="font-semibold mb-2">URL Parameters:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify({
                venueId: result.venueId,
                tableToken: result.tableToken,
                cart: result.cart
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Generate Test URL" to create a test checkout URL</li>
          <li>Click "Open Test URL" to test the checkout process</li>
          <li>Check the browser console (F12) for debugging information</li>
          <li>If it fails, check what parameters are missing</li>
        </ol>
      </div>
    </main>
  );
}
