'use client';
import { useEffect, useState } from 'react';
import { BrowserOrderLogger, OrderLogEntry } from '@smartorder/core/browser-logger';

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<OrderLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logger = new BrowserOrderLogger();
    const storageLogs = logger.getLogsFromStorage();
    setLogs(storageLogs);
    setLoading(false);
  }, []);

  const clearLogs = () => {
    const logger = new BrowserOrderLogger();
    logger.clearLogs();
    setLogs([]);
  };

  const refreshLogs = () => {
    const logger = new BrowserOrderLogger();
    const storageLogs = logger.getLogsFromStorage();
    setLogs(storageLogs);
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Lade Logs...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">🔍 Debug Logs</h1>
        <div className="flex gap-4 mb-4">
          <button
            onClick={refreshLogs}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Aktualisieren
          </button>
          <button
            onClick={clearLogs}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ Logs löschen
          </button>
        </div>
        <p className="text-gray-600">
          {logs.length} Log-Einträge gefunden
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">Keine Logs gefunden</h2>
          <p className="text-gray-600">
            Führen Sie eine Bestellung durch, um Logs zu generieren.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                log.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                    {log.success ? '✅' : '❌'}
                  </span>
                  <span className="font-semibold">{log.action}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              
              {log.orderId && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Bestell-ID:</span>
                  <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {log.orderId}
                  </span>
                </div>
              )}
              
              {log.error && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-red-600">Fehler:</span>
                  <span className="ml-2 text-red-600">{log.error}</span>
                </div>
              )}
              
              {log.details && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Details:</span>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">💡 Debugging-Tipps:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Öffnen Sie die Browser-Konsole (F12) für Live-Logs</li>
          <li>• Logs werden automatisch in localStorage gespeichert</li>
          <li>• Bei Checkout-Fehlern prüfen Sie die URL-Parameter</li>
          <li>• Testen Sie verschiedene Browser und Inkognito-Modus</li>
          <li>• Buchhaltungsdaten werden automatisch geloggt</li>
          <li>• Kitchen Board zeigt alle Bestellungsinformationen</li>
        </ul>
      </div>
    </main>
  );
}
