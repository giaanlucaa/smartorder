'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  const [showPayment, setShowPayment] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
      const cartData: CartItem[] = JSON.parse(decodeURIComponent(cartParam));
      setCart(cartData);
      
      console.log('Cart data loaded:', cartData);
      
      // Warenkorb sofort speichern
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

    // ⚠️ Wichtig: Verwende die lokal geparsten Werte – State ist hier noch nicht gesetzt.
    // Zeige Zahlungsoptionen anstatt direkt zu verarbeiten
    setLoading(false);
    setShowPayment(true);
  }, []);

  const processOrder = async (venueIdArg: string, tableTokenArg: string, cartArg: CartItem[]) => {
    try {
      console.log('Starting checkout process...', { venueId: venueIdArg, tableToken: tableTokenArg, cart: cartArg });
      
      // Parameter-Validierung
      if (!venueIdArg || !tableTokenArg || !cartArg?.length) {
        throw new Error('Fehlende Parameter (venueId/tableToken/cartData)');
      }
      
      // 1. Checkout-Session erstellen
      const checkoutRes = await fetch('/api/checkout', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          venueId: venueIdArg, 
          tableToken: tableTokenArg, 
          cartData: cartArg,
          tipAmount: tipAmount,
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
        body: JSON.stringify({ 
          venueId: venueIdArg, 
          tableToken: tableTokenArg,
          tipAmount: tipAmount
        }) 
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

  const getSubtotal = () => {
    return getCartTotal();
  };

  const getTaxAmount = () => {
    return getSubtotal() * 0.081; // 8.1% VAT
  };

  const getTotal = () => {
    return getSubtotal() + getTaxAmount() + tipAmount;
  };

  const handleTipSelection = (amount: number) => {
    setTipAmount(amount);
    setCustomTip('');
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setTipAmount(numericValue);
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Verwende die ursprünglich geparsten Werte
      const url = new URL(window.location.href);
      const venueIdParam = url.searchParams.get('venueId');
      const tableTokenParam = url.searchParams.get('tableToken');
      const cartParam = url.searchParams.get('cart');
      
      if (!venueIdParam || !tableTokenParam || !cartParam) {
        throw new Error('Fehlende Parameter');
      }
      
      const cartData: CartItem[] = JSON.parse(decodeURIComponent(cartParam));
      await processOrder(venueIdParam, tableTokenParam, cartData);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Fehler bei der Zahlung');
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen modern-gradient-subtle flex items-center justify-center">
        <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Bestellung wird verarbeitet...</h2>
          <p className="text-gray-600">Ihre Bestellung wird direkt ausgelöst</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen modern-gradient-subtle flex items-center justify-center">
        <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10 text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-red-600">Fehler beim Checkout</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link 
              href={`/t/${venueId}/${tableToken}`}
              className="modern-button px-6 py-3 rounded-lg transition-colors inline-block"
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
      </div>
    );
  }


  if (showPayment) {
    return (
      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Zahlung</h1>
          
          {/* Warenkorb Übersicht */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Ihre Bestellung</h2>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">Menge: {item.qty}</div>
                    {Object.keys(item.modifiers).length > 0 && (
                      <div className="text-xs text-gray-400">
                        {Object.entries(item.modifiers).map(([key, values]) => 
                          `${key}: ${values.join(', ')}`
                        ).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">CHF {item.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trinkgeld Auswahl */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Trinkgeld</h2>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[0, 5, 10, 15, 20].map((percentage) => {
                const amount = (getSubtotal() * percentage) / 100;
                return (
                  <button
                    key={percentage}
                    onClick={() => handleTipSelection(amount)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      tipAmount === amount
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">
                      {percentage === 0 ? 'Kein Trinkgeld' : `${percentage}%`}
                    </div>
                    {percentage > 0 && (
                      <div className="text-sm text-gray-500">CHF {amount.toFixed(2)}</div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Oder individuell:</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={customTip}
                onChange={(e) => handleCustomTip(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">CHF</span>
            </div>
          </div>

          {/* Gesamtsumme */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Zwischensumme:</span>
                <span className="text-gray-900">CHF {getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">MwSt. (8.1%):</span>
                <span className="text-gray-900">CHF {getTaxAmount().toFixed(2)}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trinkgeld:</span>
                  <span className="text-gray-900">CHF {tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Gesamt:</span>
                  <span className="text-gray-900">CHF {getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Zahlungsbutton */}
          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessingPayment ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Wird verarbeitet...
                </div>
              ) : (
                `💳 Jetzt bezahlen - CHF ${getTotal().toFixed(2)}`
              )}
            </button>
            
            <button
              onClick={() => {
                // Zurück zum Menü
                window.location.href = `/t/${venueId}/${tableToken}`;
              }}
              className="w-full bg-green-100 text-green-700 px-6 py-3 rounded-lg font-medium hover:bg-green-200 transition-colors border border-green-200"
            >
              🍽️ Zurück zum Menü
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
