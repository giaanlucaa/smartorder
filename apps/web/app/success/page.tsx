'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Success() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isTest, setIsTest] = useState(false);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [tableToken, setTableToken] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const orderIdParam = url.searchParams.get('orderId');
    const orderParam = url.searchParams.get('order');
    const paymentParam = url.searchParams.get('payment');
    const testParam = url.searchParams.get('test');
    
    setOrderId(orderIdParam || orderParam);
    setPaymentMethod(paymentParam);
    setIsTest(testParam === 'true');

    // Try to get venueId and tableToken from localStorage (from previous cart)
    try {
      const savedCart = localStorage.getItem('smartorder_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        if (cartData.venueId && cartData.tableToken) {
          setVenueId(cartData.venueId);
          setTableToken(cartData.tableToken);
        }
      }
    } catch (error) {
      console.log('Could not load cart data from localStorage');
    }
  }, []);

  return (
    <main className="max-w-2xl mx-auto p-4">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Bestellung erfolgreich!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Vielen Dank für Ihre Bestellung. Sie wird nun in der Küche zubereitet.
        </p>
        
        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-600">
              <strong>Bestellnummer:</strong> {orderId}
            </p>
            {paymentMethod && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Bestellart:</strong> {
                  paymentMethod === 'direct' ? 'Direkte Bestellung' :
                  paymentMethod === 'test' ? 'Test-Bestellung' :
                  paymentMethod === 'cash' ? 'Barzahlung' :
                  paymentMethod === 'twint' ? 'TWINT' :
                  paymentMethod === 'card' ? 'Kreditkarte' :
                  paymentMethod
                }
              </p>
            )}
            {(isTest || paymentMethod === 'direct') && (
              <p className="text-sm text-green-600 mt-2 font-semibold">
                ✅ Bestellung erfolgreich ausgelöst
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Ihre Bestellung wurde an die Küche übertragen und wird in Kürze zubereitet.
          </p>
          
          <div className="flex justify-center">
            {venueId && tableToken && (
              <Link 
                href={`/t/${venueId}/${tableToken}`}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors inline-block"
              >
                Haben Sie was vergessen?
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
