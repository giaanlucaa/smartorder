'use client';
import { useState } from 'react';
import { BrowserOrderLogger } from '@smartorder/core/browser-logger';

const logger = new BrowserOrderLogger();

export default function TestOrderFlowPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (test: string, success: boolean, details: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const testCompleteOrderFlow = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // 1. Test: Bestellung erstellen
      addTestResult('Bestellung erstellen', true, { step: 'order_creation' });
      
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: 'test-venue-123',
          tableToken: 'test-token-456'
        })
      });

      if (!orderResponse.ok) {
        throw new Error(`Bestellung erstellen fehlgeschlagen: ${orderResponse.status}`);
      }

      const order = await orderResponse.json();
      addTestResult('Bestellung erstellt', true, { orderId: order.id });

      // 2. Test: Items zur Bestellung hinzufügen
      const testItems = [
        { itemId: 'test-item-1', qty: 2, modifiers: {} },
        { itemId: 'test-item-2', qty: 1, modifiers: { size: ['large'] } }
      ];

      for (const item of testItems) {
        const itemResponse = await fetch(`/api/orders/${order.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });

        if (!itemResponse.ok) {
          throw new Error(`Item hinzufügen fehlgeschlagen: ${itemResponse.status}`);
        }
      }

      addTestResult('Items hinzugefügt', true, { itemCount: testItems.length });

      // 3. Test: Zahlung simulieren
      const paymentResponse = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: 'direct'
        })
      });

      if (!paymentResponse.ok) {
        throw new Error(`Zahlung fehlgeschlagen: ${paymentResponse.status}`);
      }

      addTestResult('Zahlung verarbeitet', true, { orderId: order.id });

      // 4. Test: Bestellung im Kitchen Board prüfen
      const ordersResponse = await fetch('/api/orders');
      if (!ordersResponse.ok) {
        throw new Error(`Kitchen Board abrufen fehlgeschlagen: ${ordersResponse.status}`);
      }

      const ordersData = await ordersResponse.json();
      const foundOrder = ordersData.orders.find((o: any) => o.id === order.id);
      
      if (foundOrder) {
        addTestResult('Bestellung im Kitchen Board', true, {
          orderId: foundOrder.id,
          status: foundOrder.status,
          total: foundOrder.total
        });
      } else {
        addTestResult('Bestellung im Kitchen Board', false, { error: 'Bestellung nicht gefunden' });
      }

      // 5. Test: Buchhaltungsdaten loggen
      if (foundOrder) {
        logger.logOrderForAccounting({
          orderId: foundOrder.id,
          venueId: foundOrder.venueId || 'test-venue',
          tableId: foundOrder.tableId || 'test-table',
          tableLabel: foundOrder.table?.label || 'Test Tisch',
          total: foundOrder.total,
          taxTotal: foundOrder.taxTotal || 0,
          tipAmount: foundOrder.tipAmount || 0,
          currency: 'CHF',
          items: foundOrder.items || [],
          payments: foundOrder.payments || [],
          createdAt: foundOrder.createdAt,
          status: foundOrder.status
        });

        addTestResult('Buchhaltungsdaten geloggt', true, {
          orderId: foundOrder.id,
          total: foundOrder.total,
          itemCount: foundOrder.items?.length || 0
        });
      }

      // 6. Test: Status-Update
      const statusResponse = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FULFILLED' })
      });

      if (!statusResponse.ok) {
        throw new Error(`Status-Update fehlgeschlagen: ${statusResponse.status}`);
      }

      addTestResult('Status-Update', true, { orderId: order.id, newStatus: 'FULFILLED' });

      // 7. Test: Finale Verifikation
      const finalOrdersResponse = await fetch('/api/orders');
      const finalOrdersData = await finalOrdersResponse.json();
      const finalOrder = finalOrdersData.orders.find((o: any) => o.id === order.id);

      if (finalOrder && finalOrder.status === 'FULFILLED') {
        addTestResult('Finale Verifikation', true, {
          orderId: finalOrder.id,
          finalStatus: finalOrder.status,
          total: finalOrder.total
        });
      } else {
        addTestResult('Finale Verifikation', false, { error: 'Status-Update nicht übernommen' });
      }

    } catch (error) {
      addTestResult('Test-Fehler', false, { error: String(error) });
      logger.logCheckoutError('Test-Order-Flow fehlgeschlagen', { error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const exportResults = () => {
    const csvContent = [
      ['Test', 'Erfolg', 'Details', 'Zeitstempel'].join(','),
      ...testResults.map(result => [
        result.test,
        result.success ? 'SUCCESS' : 'FAILED',
        JSON.stringify(result.details),
        result.timestamp
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `test_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Bestellungsfluss-Test</h1>
        <p className="text-gray-600">
          Testet den kompletten Bestellungsfluss von der Erstellung bis zum Kitchen Board
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4">
          <button
            onClick={testCompleteOrderFlow}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Teste...
              </span>
            ) : (
              '🚀 Kompletten Bestellungsfluss testen'
            )}
          </button>

          {testResults.length > 0 && (
            <>
              <button
                onClick={clearResults}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                🗑️ Ergebnisse löschen
              </button>
              <button
                onClick={exportResults}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                📄 CSV Export
              </button>
            </>
          )}
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Test-Ergebnisse</h2>
            <p className="text-gray-600">
              {testResults.filter(r => r.success).length} von {testResults.length} Tests erfolgreich
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className={`text-2xl mr-3 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? '✅' : '❌'}
                      </span>
                      <span className="font-semibold">{result.test}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString('de-DE')}
                    </span>
                  </div>
                  
                  {result.details && (
                    <div className="ml-8">
                      <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">📋 Getestete Funktionen:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Bestellung erstellen</li>
          <li>• Items zur Bestellung hinzufügen</li>
          <li>• Zahlung verarbeiten</li>
          <li>• Bestellung im Kitchen Board anzeigen</li>
          <li>• Buchhaltungsdaten loggen</li>
          <li>• Status-Updates</li>
          <li>• Finale Verifikation</li>
        </ul>
      </div>
    </main>
  );
}
