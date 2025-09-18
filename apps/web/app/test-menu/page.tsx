'use client';
import { useState, useEffect } from 'react';

export default function TestMenuPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [venueId, setVenueId] = useState('');
  const [tableToken, setTableToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [tisch1Url, setTisch1Url] = useState('');

  useEffect(() => {
    fetchRealUrls();
  }, []);

  const fetchRealUrls = async () => {
    try {
      const response = await fetch('/api/real-urls');
      const data = await response.json();
      
      if (data.tisch1) {
        setVenueId(data.tisch1.venueId);
        setTableToken(data.tisch1.qrToken);
        setTisch1Url(data.tisch1.url);
        console.log('Tisch 1 URL loaded:', data.tisch1);
      }
    } catch (error) {
      console.error('Error fetching real URLs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    setCart(prev => [...prev, item]);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Warenkorb ist leer!');
      return;
    }
    
    if (!venueId || !tableToken) {
      alert('Echte Tisch-URL wird noch geladen...');
      return;
    }
    
    const cartData = encodeURIComponent(JSON.stringify(cart));
    const url = `/checkout?venueId=${venueId}&tableToken=${tableToken}&cart=${cartData}`;
    
    console.log('Proceeding to checkout with REAL URL:', url);
    console.log('Cart data:', cart);
    console.log('Parameters:', { venueId, tableToken, cartData });
    
    window.location.href = url;
  };

  const testItems = [
    { id: 'item-1', name: 'Test Pizza', price: 15.50 },
    { id: 'item-2', name: 'Test Burger', price: 12.00 },
    { id: 'item-3', name: 'Test Salat', price: 8.50 }
  ];

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Lade echte Tisch-URLs...</h1>
          <p className="text-gray-600">Tisch 1 wird geladen</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Test Menu - Tisch 1</h1>
      
      <div className="mb-6 p-4 bg-green-50 rounded border border-green-200">
        <h2 className="font-semibold mb-2 text-green-800">✅ Echte Tisch 1 URL geladen:</h2>
        <p><strong>Venue ID:</strong> {venueId}</p>
        <p><strong>Table Token:</strong> {tableToken}</p>
        <p><strong>URL:</strong> <span className="text-sm break-all text-blue-600">{tisch1Url}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {testItems.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-gray-600">CHF {item.price.toFixed(2)}</p>
            <button
              onClick={() => addToCart({
                itemId: item.id,
                name: item.name,
                price: item.price,
                qty: 1,
                modifiers: {},
                totalPrice: item.price
              })}
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Zum Warenkorb
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h2 className="font-semibold mb-2">Warenkorb ({cart.length} Artikel):</h2>
          {cart.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>{item.name} x {item.qty}</span>
              <span>CHF {item.totalPrice.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
            <span>Gesamt:</span>
            <span>CHF {cart.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        onClick={proceedToCheckout}
        disabled={cart.length === 0}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cart.length === 0 ? 'Warenkorb ist leer' : 'Zur Kasse'}
      </button>

      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p className="text-sm">Öffnen Sie die Browser-Konsole (F12) um Debug-Informationen zu sehen.</p>
        <p className="text-sm">Die Checkout-URL wird in der Konsole angezeigt.</p>
      </div>
    </main>
  );
}
