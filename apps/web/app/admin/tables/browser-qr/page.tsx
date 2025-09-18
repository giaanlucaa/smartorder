'use client';
import { useState, useEffect } from 'react';
import { generateTableQR, showQRInWindow, downloadQRCode } from '@smartorder/qr/browser-generate';

interface Table {
  id: string;
  label: string;
  qrToken: string;
  area: {
    name: string;
  };
}

interface Area {
  id: string;
  name: string;
  tables: Table[];
}

export default function BrowserQRPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/admin/tables');
      if (response.ok) {
        const data = await response.json();
        setAreas(data.areas);
      } else if (response.status === 401) {
        window.location.href = '/admin/auth/login';
      } else {
        setError('Fehler beim Laden der Tische');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (table: Table) => {
    setGeneratingQR(table.id);
    
    try {
      const qrResult = await generateTableQR({
        venueId: 'current-venue', // Wird aus dem Kontext geholt
        tableToken: table.qrToken,
        tableLabel: table.label,
        appUrl: window.location.origin
      });

      // QR-Code in neuem Fenster anzeigen
      showQRInWindow(qrResult.dataUrl, table.label);
      
    } catch (error) {
      console.error('QR-Code-Generierung fehlgeschlagen:', error);
      alert('Fehler beim Generieren des QR-Codes');
    } finally {
      setGeneratingQR(null);
    }
  };

  const downloadQR = async (table: Table) => {
    setGeneratingQR(table.id);
    
    try {
      const qrResult = await generateTableQR({
        venueId: 'current-venue',
        tableToken: table.qrToken,
        tableLabel: table.label,
        appUrl: window.location.origin
      });

      // QR-Code herunterladen
      await downloadQRCode(qrResult.dataUrl, table.label);
      
    } catch (error) {
      console.error('QR-Code-Download fehlgeschlagen:', error);
      alert('Fehler beim Download des QR-Codes');
    } finally {
      setGeneratingQR(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen modern-gradient-subtle flex items-center justify-center">
        <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lade Tische...</h2>
          <p className="text-gray-600">Bitte warten Sie einen Moment</p>
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
          <h2 className="text-xl font-semibold mb-2 text-red-600">Fehler</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchTables}
            className="modern-button px-6 py-3 rounded-lg transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📱 Browser QR-Codes</h1>
        <p className="text-gray-600">
          Generieren und verwalten Sie QR-Codes direkt im Browser
        </p>
      </div>

      <div className="space-y-8">
        {areas.map((area) => (
          <div key={area.id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{area.name}</h2>
            
            {area.tables.length === 0 ? (
              <p className="text-gray-500 italic">Keine Tische in diesem Bereich</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {area.tables.map((table) => (
                  <div key={table.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">Tisch {table.label}</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {table.qrToken.substring(0, 8)}...
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => generateQRCode(table)}
                        disabled={generatingQR === table.id}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingQR === table.id ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generiere...
                          </span>
                        ) : (
                          '📱 QR-Code anzeigen'
                        )}
                      </button>
                      
                      <button
                        onClick={() => downloadQR(table)}
                        disabled={generatingQR === table.id}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingQR === table.id ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Lade herunter...
                          </span>
                        ) : (
                          '💾 QR-Code herunterladen'
                        )}
                      </button>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      <p>URL: {window.location.origin}/t/venue/{table.qrToken}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {areas.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold mb-2">Keine Bereiche gefunden</h2>
          <p className="text-gray-600 mb-6">
            Erstellen Sie zuerst Bereiche und Tische, um QR-Codes zu generieren.
          </p>
          <a
            href="/admin/tables"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Zur Tischverwaltung
          </a>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">💡 Browser QR-Code Features:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• QR-Codes werden direkt im Browser generiert</li>
          <li>• Keine Server-Abhängigkeiten</li>
          <li>• Sofortige Anzeige in neuem Fenster</li>
          <li>• Download als PNG-Datei</li>
          <li>• Druckfunktion integriert</li>
        </ul>
      </div>
    </main>
  );
}
