'use client';
import { useState, useEffect } from 'react';
import { printOrderInWindow, downloadOrderAsText } from '@smartorder/printer/browser-format';
import AdminLayout from '../../components/AdminLayout';

interface OrderItem {
  id: string;
  qty: number;
  unitPrice: number;
  modifiers: any;
  item: {
    id: string;
    name: string;
    description: string;
    allergens: string[];
  };
}

interface Order {
  id: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'CANCELLED' | 'FULFILLED';
  total: number;
  createdAt: string;
  table: {
    label: string;
    area: {
      name: string;
    };
  };
  items: OrderItem[];
}

export default function BrowserKitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 5000); // Alle 5 Sekunden aktualisieren
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders?status=OPEN');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        setError('Fehler beim Laden der Bestellungen');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'FULFILLED' | 'CANCELLED') => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchOrders(); // Aktualisiere die Liste
      } else {
        alert('Fehler beim Aktualisieren des Bestellstatus');
      }
    } catch (error) {
      console.error('Status-Update-Fehler:', error);
      alert('Fehler beim Aktualisieren des Bestellstatus');
    }
  };

  const printOrder = (order: Order) => {
    try {
      const printData = {
        orderId: order.id,
        tableLabel: order.table.label,
        items: order.items.map(item => ({
          name: item.item.name,
          quantity: item.qty,
          modifiers: Object.values(item.modifiers || {}).flat() as string[],
          notes: item.item.description
        })),
        timestamp: new Date(order.createdAt),
        total: order.total
      };

      printOrderInWindow(printData);
    } catch (error) {
      console.error('Druck-Fehler:', error);
      alert('Fehler beim Drucken der Bestellung');
    }
  };

  const downloadOrder = (order: Order) => {
    try {
      const printData = {
        orderId: order.id,
        tableLabel: order.table.label,
        items: order.items.map(item => ({
          name: item.item.name,
          quantity: item.qty,
          modifiers: Object.values(item.modifiers || {}).flat() as string[],
          notes: item.item.description
        })),
        timestamp: new Date(order.createdAt),
        total: order.total
      };

      downloadOrderAsText(printData);
    } catch (error) {
      console.error('Download-Fehler:', error);
      alert('Fehler beim Download der Bestellung');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'FULFILLED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <AdminLayout title="Kitchen Display" subtitle="Lade Bestellungen..." showSidebar={false}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lade Bestellungen...</h2>
            <p className="text-gray-600">Bitte warten Sie einen Moment</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kitchen Display" subtitle="Live-Ansicht aller offenen Bestellungen" showSidebar={false}>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <a 
                href="/admin"
                className="modern-button-secondary px-4 py-2 rounded-lg text-sm"
              >
                ← Admin Dashboard
              </a>
              <a 
                href="/kitchen"
                className="modern-button px-4 py-2 rounded-lg text-sm"
              >
                📋 Bestellungsverwaltung
              </a>
            </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-Refresh</span>
            </label>
            
            <button
              onClick={fetchOrders}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Aktualisieren
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🍽️</div>
          <h2 className="text-xl font-semibold mb-2">Keine offenen Bestellungen</h2>
          <p className="text-gray-600">
            Alle Bestellungen sind abgeschlossen oder es sind keine Bestellungen vorhanden.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Bestellung #{order.id.slice(-8)}</h3>
                  <p className="text-sm text-gray-600">
                    Tisch {order.table.label} • {order.table.area.name}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString('de-DE')}
                </p>
                <p className="text-lg font-semibold">
                  Gesamt: {order.total.toFixed(2)} €
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Bestellte Artikel:</h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.qty}x {item.item.name}</span>
                        {item.item.allergens.length > 0 && (
                          <span className="text-red-600 ml-2">
                            ⚠️ {item.item.allergens.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-600">
                        {(item.unitPrice * item.qty).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => printOrder(order)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  🖨️ Drucken
                </button>
                
                <button
                  onClick={() => downloadOrder(order)}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  💾 Download
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'FULFILLED')}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    ✅ Fertig
                  </button>
                  
                  <button
                    onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    ❌ Stornieren
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">💡 Browser Kitchen Features:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Live-Updates alle 5 Sekunden</li>
          <li>• Direktes Drucken im Browser</li>
          <li>• Download als Text-Datei</li>
          <li>• Status-Updates ohne Seitenreload</li>
          <li>• Responsive Design für Tablets</li>
        </ul>
      </div>
      </div>
    </AdminLayout>
  );
}
