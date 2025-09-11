'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
// @ts-expect-error: Module may not be available in all environments
import { BrowserOrderLogger } from '@smartorder/core/browser-logger';

interface CartItem {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  modifiers: Record<string, string[]>;
  totalPrice: number;
}

const orderLogger = new BrowserOrderLogger();

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [venueId, setVenueId] = useState<string>('');
  const [tableToken, setTableToken] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const venueIdParam = url.searchParams.get('venueId');
    const tableTokenParam = url.searchParams.get('tableToken');
    const cartParam = url.searchParams.get('cart');

    console.log('Checkout parameters:', {
      venueId: venueIdParam,
      tableToken: tableTokenParam,
      cart: cartParam ? 'present' : 'missing',
      fullUrl: window.location.href
    });

    if (!venueIdParam || !tableTokenParam || !cartParam) {
      const missingParams = [];
      if (!venueIdParam) missingParams.push('venueId');
      if (!tableTokenParam) missingParams.push('tableToken');
      if (!cartParam) missingParams.push('cart');
      
      const errorMessage = `Fehlende Parameter: ${missingParams.join(', ')}. URL: ${window.location.href}`;
      
      // Log den Fehler
      orderLogger.log({
        action: 'CHECKOUT_PARAMETER_ERROR',
        details: {
          missingParams,
          url: window.location.href,
          venueId: venueIdParam,
          tableToken: tableTokenParam,
          cartPresent: !!cartParam
        },
        success: false,
        error: errorMessage
      });
      
      setError(errorMessage);
      setLoading(false);
      return;
    }

    setVenueId(venueIdParam);
    setTableToken(tableTokenParam);

    try {
      const cartData = JSON.parse(decodeURIComponent(cartParam));
      setCart(cartData);
      
      console.log('Cart data loaded:', cartData);
      
      // Warenkorb sofort speichern für den Fall von Fehlern
      saveCartToStorage(cartData, venueIdParam, tableTokenParam);
    } catch (err) {
      console.error('Error parsing cart data:', err);
      
      // Log den Fehler
      orderLogger.log({
        action: 'CHECKOUT_CART_PARSE_ERROR',
        details: {
          cartParam,
          url: window.location.href,
          venueId: venueIdParam,
          tableToken: tableTokenParam
        },
        success: false,
        error: String(err)
      });
      
      setError('Ungültige Warenkorb-Daten');
      setLoading(false);
      return;
    }

    processOrder();
  }, []);

  const processOrder = async () => {
    try {
      console.log('Starting checkout process...', { venueId, tableToken, cart });
      
      // 1. Checkout-Session erstellen
      const checkoutRes = await fetch('/api/checkout', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venueId, 
          tableToken, 
          cartData: cart,
          sessionId: `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }) 
      });
      
      if (!checkoutRes.ok) {
        const errorText = await checkoutRes.text();
        console.error('Checkout creation failed:', checkoutRes.status, errorText);
        let errorMessage = `Fehler beim Erstellen der Checkout-Session: ${checkoutRes.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'Table not found') {
            errorMessage = 'Tisch nicht gefunden. Bitte prüfen Sie die QR-Code-URL.';
          } else if (errorData.error?.includes('Missing required parameters')) {
            errorMessage = 'Fehlende Parameter. Bitte versuchen Sie es erneut.';
          }
        } catch (e) {
          // Keep the original error message
        }
        
        throw new Error(errorMessage);
      }
      
      const checkoutData = await checkoutRes.json();
      console.log('Checkout created:', checkoutData);
      
      // 2. Bestellung erstellen
      const orderRes = await fetch('/api/orders', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId, tableToken }) 
      });
      
      if (!orderRes.ok) {
        const errorText = await orderRes.text();
        console.error('Order creation failed:', orderRes.status, errorText);
        throw new Error(`Fehler beim Erstellen der Bestellung: ${orderRes.status}`);
      }
      
      const order = await orderRes.json();
      console.log('Order created:', order);
      setOrderId(order.id);

      // 3. Checkout mit Bestellung verknüpfen
      await fetch(`/api/checkout/${checkoutData.checkout.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: order.id,
          status: 'PROCESSING'
        })
      });

      // 4. Alle Artikel zur Bestellung hinzufügen
      for (const cartItem of cart) {
        console.log('Adding item to order:', cartItem);
        const itemRes = await fetch(`/api/orders/${order.id}/items`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            itemId: cartItem.itemId, 
            qty: cartItem.qty,
            modifiers: cartItem.modifiers
          }) 
        });
        
        if (!itemRes.ok) {
          const errorText = await itemRes.text();
          console.error('Item addition failed:', itemRes.status, errorText);
          throw new Error(`Fehler beim Hinzufügen von ${cartItem.name}: ${itemRes.status}`);
        }
      }

      // 5. Checkout als abgeschlossen markieren
      await fetch(`/api/checkout/${checkoutData.checkout.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'COMPLETED'
        })
      });

      // 6. Bestellung direkt als bezahlt markieren und zur Erfolgsseite
      await markOrderAsPaid(order.id);
    } catch (err) {
      console.error('Checkout error:', err);
      // Warenkorb bei Fehler speichern
      saveCartToStorage();
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Checkout');
      setLoading(false);
    }
  };

  const saveCartToStorage = (cartData?: CartItem[], venueIdParam?: string, tableTokenParam?: string) => {
    try {
      const data = {
        cart: cartData || cart,
        venueId: venueIdParam || venueId,
        tableToken: tableTokenParam || tableToken,
        timestamp: Date.now()
      };
      localStorage.setItem('smartorder_cart', JSON.stringify(data));
      console.log('Warenkorb gespeichert:', data);
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  };

  const markOrderAsPaid = async (orderId: string) => {
    try {
      console.log('Marking order as paid:', orderId);
      
      // Bestellung direkt als bezahlt markieren
      const paymentRes = await fetch('/api/payments/intent', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentMethod: 'direct' }) 
      });
      
      if (!paymentRes.ok) {
        const errorText = await paymentRes.text();
        console.error('Payment marking failed:', paymentRes.status, errorText);
        throw new Error(`Fehler beim Abschließen der Bestellung: ${paymentRes.status}`);
      }
      
      const payment = await paymentRes.json();
      console.log('Payment processed:', payment);
      
      // Warenkorb leeren
      localStorage.removeItem('smartorder_cart');
      
      // Zur Erfolgsseite weiterleiten
      window.location.href = payment.redirectUrl;
    } catch (err) {
      console.error('Order completion error:', err);
      saveCartToStorage();
      setError(err instanceof Error ? err.message : 'Fehler beim Abschließen der Bestellung');
      setLoading(false);
    }
  };


  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Bestellung wird verarbeitet...</h1>
          <p className="text-gray-600">Ihre Bestellung wird direkt ausgelöst</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold mb-2 text-red-600">Fehler beim Checkout</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link 
              href={`/t/${venueId}/${tableToken}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Zurück zum Menü
            </Link>
            <div>
              <button
                onClick={() => {
                  const savedCart = localStorage.getItem('smartorder_cart');
                  if (savedCart) {
                    try {
                      const cartData = JSON.parse(savedCart);
                      console.log('Restoring cart:', cartData);
                      
                      if (cartData.cart && cartData.venueId && cartData.tableToken) {
                        const cartParam = encodeURIComponent(JSON.stringify(cartData.cart));
                        const url = `/checkout?venueId=${cartData.venueId}&tableToken=${cartData.tableToken}&cart=${cartParam}`;
                        console.log('Restoring with URL:', url);
                        window.location.href = url;
                      } else {
                        alert('Gespeicherte Warenkorb-Daten sind unvollständig');
                      }
                    } catch (error) {
                      console.error('Error restoring cart:', error);
                      alert('Fehler beim Wiederherstellen des Warenkorbs');
                    }
                  } else {
                    alert('Kein gespeicherter Warenkorb gefunden');
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Gespeicherten Warenkorb wiederherstellen
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }


  return (
    <main className="max-w-2xl mx-auto p-4">
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold mb-2">Bestellung wird verarbeitet...</h1>
        <p className="text-gray-600">Ihre Bestellung wird direkt ausgelöst</p>
      </div>
    </main>
  );
}
