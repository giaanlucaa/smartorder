'use client';

import { useState, useEffect } from 'react';
import { BrowserOrderLogger } from '@smartorder/core/browser-logger';
import Pusher from 'pusher-js';

interface OrderItem {
  id: string;
  qty: number;
  unitPrice: number;
  modifiers: Record<string, any>;
  item: {
    id: string;
    name: string;
    description?: string;
    allergens: string[];
  };
}

interface Order {
  id: string;
  status: 'OPEN' | 'PAID' | 'FULFILLED' | 'CANCELLED';
  total: number;
  taxTotal: number;
  tipAmount: number;
  createdAt: string;
  updatedAt: string;
  table: {
    label: string;
    area: {
      name: string;
    };
  };
  venue: {
    id: string;
    name: string;
    currency: string;
  };
  items: OrderItem[];
  payments: {
    id: string;
    provider: string;
    status: string;
    amount: number;
    createdAt: string;
  }[];
}

const logger = new BrowserOrderLogger();

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'paid'>('all');
  const [venueId, setVenueId] = useState<string>('');

  useEffect(() => {
    fetchOrders();
    
    // Initialize Pusher for real-time updates
    initializePusher();
    
    // Fallback polling (reduced frequency since we have Pusher)
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializePusher = () => {
    try {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || 'dummy', {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
        forceTLS: true
      });

      // Subscribe to all venues (in a real app, you'd filter by current venue)
      const channel = pusher.subscribe('venue-demo');
      
      channel.bind('order-paid', (data: any) => {
        console.log('New order received via Pusher:', data);
        
        // Update orders list immediately
        setOrders(prevOrders => {
          const existingOrderIndex = prevOrders.findIndex(order => order.id === data.orderId);
          
          if (existingOrderIndex >= 0) {
            // Update existing order
            const updatedOrders = [...prevOrders];
            updatedOrders[existingOrderIndex] = {
              ...updatedOrders[existingOrderIndex],
              status: data.status,
              tipAmount: data.tipAmount,
              updatedAt: data.paidAt
            };
            return updatedOrders;
          } else {
            // Add new order (this shouldn't happen in normal flow, but just in case)
            const newOrder: Order = {
              id: data.orderId,
              status: data.status,
              total: parseFloat(data.total),
              taxTotal: 0, // Will be updated on next fetch
              tipAmount: parseFloat(data.tipAmount || 0),
              createdAt: data.createdAt,
              updatedAt: data.paidAt,
              table: {
                label: data.table,
                area: { name: data.area }
              },
              venue: {
                id: 'demo',
                name: 'Demo Restaurant',
                currency: 'CHF'
              },
              items: data.items.map((item: any) => ({
                id: item.id,
                qty: item.qty,
                unitPrice: parseFloat(item.unitPrice),
                modifiers: item.modifiers,
                item: {
                  id: item.id,
                  name: item.name,
                  description: '',
                  allergens: []
                }
              })),
              payments: data.payments || []
            };
            return [newOrder, ...prevOrders];
          }
        });

        // Log for accounting
        logger.logOrderForAccounting({
          orderId: data.orderId,
          venueId: data.venueId || 'demo',
          tableId: data.table,
          tableLabel: data.table,
          total: parseFloat(data.total),
          taxTotal: 0,
          tipAmount: parseFloat(data.tipAmount || 0),
          currency: 'CHF',
          items: data.items,
          payments: data.payments || [],
          createdAt: data.createdAt,
          status: data.status
        });
      });

      console.log('Pusher initialized for kitchen dashboard');
    } catch (error) {
      console.error('Failed to initialize Pusher:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      const newOrders = data.orders || [];
      setOrders(newOrders);
      
      // Set venue ID from first order for Pusher channel
      if (newOrders.length > 0 && !venueId) {
        setVenueId(newOrders[0].venue.id);
      }
      
      // Logge alle Bestellungen für Buchhaltung
      newOrders.forEach((order: Order) => {
        logger.logOrderForAccounting({
          orderId: order.id,
          venueId: order.venue.id,
          tableId: order.table.label,
          tableLabel: order.table.label,
          total: order.total,
          taxTotal: order.taxTotal,
          tipAmount: order.tipAmount,
          currency: order.venue.currency,
          items: order.items,
          payments: order.payments,
          createdAt: order.createdAt,
          status: order.status
        });
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      logger.logCheckoutError('Fehler beim Laden der Bestellungen', { error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'PAID' | 'FULFILLED') => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'open') return order.status === 'OPEN';
    if (filter === 'paid') return order.status === 'PAID';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAID': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FULFILLED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Offen';
      case 'PAID': return 'Bezahlt';
      case 'FULFILLED': return 'Fertig';
      case 'CANCELLED': return 'Storniert';
      default: return status;
    }
  };

  if (loading) {
    return (
      <main className="p-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Lade Bestellungen...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kitchen Display System</h1>
          <div className="mt-2">
            <a 
              href="/admin"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              ← Zurück zum Admin Dashboard
            </a>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alle ({orders.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'open' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Offen ({orders.filter(o => o.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'paid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Bezahlt ({orders.filter(o => o.status === 'PAID').length})
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🍽️</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Keine Bestellungen</h2>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'Es sind noch keine Bestellungen eingegangen.' 
              : `Keine Bestellungen mit Status "${getStatusText(filter)}" vorhanden.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Tisch {order.table.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {order.table.area.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString('de-CH')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <p className="text-lg font-bold mt-1">
                    {order.venue.currency} {Number(order.total).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Bestell-ID: {order.id.slice(-8)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {order.items.map((item) => (
                  <div key={item.id} className="border-l-4 border-blue-200 pl-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {item.qty}x {item.item.name}
                        </p>
                        {item.item.description && (
                          <p className="text-sm text-gray-600">
                            {item.item.description}
                          </p>
                        )}
                        {item.item.allergens.length > 0 && (
                          <p className="text-xs text-red-600">
                            ⚠️ {item.item.allergens.join(', ')}
                          </p>
                        )}
                        {Object.keys(item.modifiers).length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {Object.entries(item.modifiers).map(([key, value]) => (
                              <div key={key}>
                                {key}: {Array.isArray(value) ? value.join(', ') : value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        CHF {(Number(item.unitPrice) * item.qty).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Buchhaltungsinformationen */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-sm mb-2">📊 Buchhaltungsdetails</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Netto:</span>
                    <span className="font-medium ml-1">
                      {order.venue.currency} {(Number(order.total) - Number(order.taxTotal)).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">MwSt:</span>
                    <span className="font-medium ml-1">
                      {order.venue.currency} {Number(order.taxTotal).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Trinkgeld:</span>
                    <span className="font-medium ml-1">
                      {order.venue.currency} {Number(order.tipAmount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Gesamt:</span>
                    <span className="font-bold ml-1">
                      {order.venue.currency} {Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {order.payments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-600 text-xs">Zahlungen:</span>
                    {order.payments.map((payment) => (
                      <div key={payment.id} className="text-xs mt-1">
                        <span className="font-medium">{payment.provider}</span>
                        <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                          payment.status === 'SETTLED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                        <span className="ml-2">{order.venue.currency} {Number(payment.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                {order.status === 'OPEN' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'PAID')}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Als bezahlt markieren
                  </button>
                )}
                {order.status === 'PAID' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'FULFILLED')}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Als fertig markieren
                  </button>
                )}
                {order.status === 'FULFILLED' && (
                  <div className="flex-1 bg-green-100 text-green-800 py-2 px-4 rounded-lg font-medium text-center">
                    ✅ Fertig
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
