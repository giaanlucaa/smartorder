'use client';
import { useState, useEffect } from 'react';
import { BrowserOrderLogger } from '@smartorder/core/browser-logger';

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
    price: number;
    taxRate: number;
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

export default function AccountingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [summary, setSummary] = useState<any>(null);

  const logger = new BrowserOrderLogger();

  useEffect(() => {
    fetchOrders();
  }, [dateFilter, statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const res = await fetch(`/api/kitchen/orders?${params.toString()}`);
      const data = await res.json();
      const allOrders = data.orders || [];
      
      // Filtere nach Datum
      const filteredOrders = allOrders.filter((order: Order) => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === dateFilter;
      });
      
      setOrders(filteredOrders);
      calculateSummary(filteredOrders);
      
      // Logge alle Bestellungen für Buchhaltung
      filteredOrders.forEach((order: Order) => {
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
      logger.logCheckoutError('Fehler beim Laden der Buchhaltungsdaten', { error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (orders: Order[]) => {
    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + Number(order.total), 0),
      totalTax: orders.reduce((sum, order) => sum + Number(order.taxTotal), 0),
      totalTips: orders.reduce((sum, order) => sum + Number(order.tipAmount || 0), 0),
      totalNet: 0,
      statusCounts: {
        OPEN: orders.filter(o => o.status === 'OPEN').length,
        PAID: orders.filter(o => o.status === 'PAID').length,
        FULFILLED: orders.filter(o => o.status === 'FULFILLED').length,
        CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
      },
      paymentMethods: {} as Record<string, number>,
      topItems: {} as Record<string, number>
    };

    // Berechne Netto
    summary.totalNet = summary.totalRevenue - summary.totalTax;

    // Zähle Zahlungsmethoden
    orders.forEach(order => {
      order.payments.forEach(payment => {
        summary.paymentMethods[payment.provider] = (summary.paymentMethods[payment.provider] || 0) + Number(payment.amount);
      });
    });

    // Zähle beliebte Artikel
    orders.forEach(order => {
      order.items.forEach(item => {
        summary.topItems[item.item.name] = (summary.topItems[item.item.name] || 0) + item.qty;
      });
    });

    setSummary(summary);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Bestell-ID', 'Datum', 'Zeit', 'Tisch', 'Bereich', 'Status', 'Netto', 'MwSt', 'Trinkgeld', 'Gesamt', 'Zahlungsmethode', 'Artikel'].join(','),
      ...orders.map(order => [
        order.id,
        new Date(order.createdAt).toLocaleDateString('de-DE'),
        new Date(order.createdAt).toLocaleTimeString('de-DE'),
        order.table.label,
        order.table.area.name,
        order.status,
        (Number(order.total) - Number(order.taxTotal)).toFixed(2),
        Number(order.taxTotal).toFixed(2),
        Number(order.tipAmount || 0).toFixed(2),
        Number(order.total).toFixed(2),
        order.payments.map(p => p.provider).join(';'),
        order.items.map(i => `${i.qty}x ${i.item.name}`).join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `buchhaltung_${dateFilter}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Lade Buchhaltungsdaten...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Buchhaltung</h1>
            <p className="text-gray-600">Bestellungsübersicht und Finanzdaten</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              📄 CSV Export
            </button>
            <a
              href="/admin"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Zurück zum Admin
            </a>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle</option>
              <option value="OPEN">Offen</option>
              <option value="PAID">Bezahlt</option>
              <option value="FULFILLED">Fertig</option>
              <option value="CANCELLED">Storniert</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchOrders}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Aktualisieren
            </button>
          </div>
        </div>
      </div>

      {/* Zusammenfassung */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Bestellungen</h3>
            <p className="text-3xl font-bold text-blue-600">{summary.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Umsatz</h3>
            <p className="text-3xl font-bold text-green-600">CHF {summary.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">MwSt</h3>
            <p className="text-3xl font-bold text-orange-600">CHF {summary.totalTax.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Trinkgeld</h3>
            <p className="text-3xl font-bold text-purple-600">CHF {summary.totalTips.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Bestellungen */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Bestellungen vom {new Date(dateFilter).toLocaleDateString('de-DE')}</h2>
        </div>
        
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine Bestellungen</h3>
            <p className="text-gray-500">Für den ausgewählten Zeitraum wurden keine Bestellungen gefunden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bestellung</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tisch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Netto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MwSt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gesamt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zahlung</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.id.slice(-8)}</div>
                      <div className="text-sm text-gray-500">{order.items.length} Artikel</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Tisch {order.table.label}</div>
                      <div className="text-sm text-gray-500">{order.table.area.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleTimeString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'FULFILLED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      CHF {(Number(order.total) - Number(order.taxTotal)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      CHF {Number(order.taxTotal).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      CHF {Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.payments.length > 0 ? (
                        <div>
                          <div className="font-medium">{order.payments[0].provider}</div>
                          <div className="text-xs text-gray-500">{order.payments[0].status}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Keine</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
