'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrowserOrderLogger } from '@smartorder/core/browser-logger';
import { UiFlags } from '@/lib/uiSettings';
import { getTenantUiFromData } from '@/lib/getTenantUi';

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
  const [showPay, setShowPay] = useState(false);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [uiFlags, setUiFlags] = useState<UiFlags>({
    showBackToMenuDuringPayment: true,
    showForgotSomethingAfterOrder: true,
    showPaymentLoadingState: true,
  });

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

    // Load UI flags for this venue (with defaults)
    loadUiFlags(venueIdParam!);

    try {
      const cartData: CartItem[] = JSON.parse(decodeURIComponent(cartParam));
      setCart(cartData);
      
      console.log('Cart data loaded:', cartData);
      
      // Warenkorb sofort speichern
      saveCartToStorage(cartData, venueIdParam, tableTokenParam);
      
      // ⚠️ Wichtig: Verwende die lokal geparsten Werte – State ist hier noch nicht gesetzt.
      processOrder(venueIdParam!, tableTokenParam!, cartData);
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
  }, []);

  const loadUiFlags = async (venueId: string) => {
    try {
      // For now, use defaults. In a real app, you'd fetch from API
      const flags = getTenantUiFromData();
      setUiFlags(flags);
    } catch (error) {
      console.warn('Failed to load UI flags, using defaults:', error);
      // Defaults are already set in useState
    }
  };

  const processOrder = async (venueIdArg: string, tableTokenArg: string, cartArg: CartItem[]) => {
    try {
      // Parameter-Validierung
      if (!venueIdArg || !tableTokenArg || !cartArg?.length) {
        throw new Error('Fehlende Parameter (venueId/tableToken/cartData)');
      }
      
      console.log('Starting checkout process...', { venueId: venueIdArg, tableToken: tableTokenArg, cart: cartArg });
      
      // 1. Checkout-Session erstellen
      const checkoutRes = await fetch('/api/checkout', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venueId: venueIdArg, 
          tableToken: tableTokenArg, 
          cartData: cartArg,
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
        body: JSON.stringify({ venueId: venueIdArg, tableToken: tableTokenArg }) 
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
      for (const cartItem of cartArg) {
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

      // 5. Checkout bleibt auf PROCESSING (nicht COMPLETED)
      // 6. Test-Zahlungsdialog mit Trinkgeld öffnen (noch NICHT bestätigen)
      setOrderId(order.id);
      setShowPay(true);
      setLoading(false);
    } catch (err) {
      console.error('Checkout error:', err);
      // Warenkorb bei Fehler speichern
      saveCartToStorage(cartArg, venueIdArg, tableTokenArg);
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
      if (!orderId) {
        alert('Order-ID fehlt');
        return;
      }
      
      console.log('Processing order completion:', orderId);
      
      // Process order completion (handles PSP_PROVIDER=none automatically)
      const paymentRes = await fetch('/api/payments/intent', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'x-venue-id': venueIdArg  // Add venue ID as header for tenant identification
        },
        body: JSON.stringify({ orderId, paymentMethod: 'direct' }) 
      });
      
      const data = await paymentRes.json().catch(() => ({}));
      if (!paymentRes.ok) {
        console.error('Order completion failed:', paymentRes.status, data);
        alert(data?.error || 'Fehlende Parameter. Bitte versuchen Sie es erneut.');
        return;
      }
      
      console.log('Order completed:', data);
      
      // Warenkorb leeren
      localStorage.removeItem('smartorder_cart');
      
      // Zur Erfolgsseite weiterleiten
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      alert('Unerwartete Antwort vom Server.');
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

  const calcTip = () => {
    const total = getCartTotal();
    if (showCustomTip && customTip !== '') {
      const customAmount = parseFloat(customTip);
      return isNaN(customAmount) ? 0 : customAmount;
    }
    return total * (tipPercent / 100);
  };

  const confirmTestPayment = async () => {
    if (paymentLoading) return; // Prevent double-clicks
    
    try {
      setPaymentLoading(true);
      const tipAmount = calcTip();
      console.log('Sending payment request:', { orderId, paymentMethod: 'test', tipAmount });
      
      const res = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-venue-id': venueId  // Add venue ID as header for tenant identification
        },
        body: JSON.stringify({
          orderId,
          paymentMethod: 'test',
          tipAmount,
        }),
      });
      
      console.log('Payment response status:', res.status);
      const data = await res.json();
      console.log('Payment response data:', data);
      
      if (!res.ok) {
        console.error('Payment failed:', data);
        alert(`Zahlung fehlgeschlagen: ${data?.error || 'Unbekannter Fehler'}`);
        return;
      }
      
      localStorage.removeItem('smartorder_cart');
      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error('Payment confirmation error:', err);
      alert('Fehler bei der Zahlungsbestätigung: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setPaymentLoading(false);
    }
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
            {uiFlags.showBackToMenuDuringPayment && (
              <Link 
                href={`/t/${venueId}/${tableToken}`}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Zurück zum Menü
              </Link>
            )}
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


  if (showPay) {
    const total = getCartTotal();
    const tipAmount = calcTip();
    const finalTotal = total + tipAmount;

    return (
      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Zahlung bestätigen</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Bestellübersicht</h2>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.name} x {item.qty}</span>
                  <span>CHF {item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-4">
              <div className="flex justify-between font-semibold">
                <span>Zwischensumme:</span>
                <span>CHF {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Trinkgeld</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => { setTipPercent(0); setCustomTip(''); setShowCustomTip(false); }}
                className={`p-3 rounded-lg border ${tipPercent === 0 && !showCustomTip ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
              >
                0%
              </button>
              <button
                onClick={() => { setTipPercent(5); setCustomTip(''); setShowCustomTip(false); }}
                className={`p-3 rounded-lg border ${tipPercent === 5 && !showCustomTip ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
              >
                5%
              </button>
              <button
                onClick={() => { setTipPercent(10); setCustomTip(''); setShowCustomTip(false); }}
                className={`p-3 rounded-lg border ${tipPercent === 10 && !showCustomTip ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
              >
                10%
              </button>
              <button
                onClick={() => { 
                  setTipPercent(0); 
                  setCustomTip(''); 
                  setShowCustomTip(true);
                  // Focus auf das Input-Feld nach einem kurzen Delay
                  setTimeout(() => {
                    const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                    if (input) input.focus();
                  }, 100);
                }}
                className={`p-3 rounded-lg border ${showCustomTip ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
              >
                Custom
              </button>
            </div>
            
            {showCustomTip && (
              <div className="mb-4">
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  placeholder="Betrag in CHF"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Trinkgeld:</span>
              <span>CHF {tipAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between text-xl font-bold">
              <span>Gesamtbetrag:</span>
              <span>CHF {finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-4">
            {uiFlags.showBackToMenuDuringPayment && (
              <Link
                href={`/t/${venueId}/${tableToken}`}
                className="flex-1 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition-colors"
              >
                Zurück zum Menü
              </Link>
            )}
            <button
              onClick={confirmTestPayment}
              disabled={paymentLoading}
              className={`flex-1 p-3 rounded-lg transition-colors ${
                paymentLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {paymentLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Zahlung läuft...
                </div>
              ) : (
                'Bezahlen (Test)'
              )}
            </button>
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
