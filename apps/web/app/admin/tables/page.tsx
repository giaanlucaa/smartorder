'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Table {
  id: string;
  label: string;
  qrToken: string;
  area: {
    id: string;
    name: string;
  };
}

interface Area {
  id: string;
  name: string;
  tables: Table[];
}

export default function TablesPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rotatingToken, setRotatingToken] = useState<string | null>(null);
  const [showCreateArea, setShowCreateArea] = useState(false);
  const [showCreateTable, setShowCreateTable] = useState<string | null>(null);
  const [newAreaName, setNewAreaName] = useState('');
  const [newTableLabel, setNewTableLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

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
        router.push('/admin/auth/login');
      } else {
        setError('Fehler beim Laden der Tische');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const rotateToken = async (tableId: string) => {
    setRotatingToken(tableId);
    try {
      const response = await fetch(`/api/admin/tables/${tableId}/rotate-token`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchTables(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (error) {
      alert('Fehler beim Rotieren des Tokens');
    } finally {
      setRotatingToken(null);
    }
  };

  const getQRCode = async (tableId: string) => {
    try {
      const response = await fetch(`/api/admin/tables/${tableId}/qr`);
      if (response.ok) {
        const data = await response.json();
        
        // Open QR code in new tab with actual QR code image
        const qrWindow = window.open('', '_blank');
        if (qrWindow) {
          qrWindow.document.write(`
            <html>
              <head>
                <title>QR Code - ${data.tableLabel}</title>
                <style>
                  body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 20px; 
                    margin: 0;
                    background: #f5f5f5;
                  }
                  .container {
                    max-width: 400px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  }
                  h1 { color: #333; margin-bottom: 10px; }
                  h2 { color: #666; margin-bottom: 20px; }
                  .qr-container {
                    margin: 20px 0;
                    padding: 20px;
                    background: #f9f9f9;
                    border-radius: 8px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                  }
                  .qr-code {
                    max-width: 100%;
                    height: auto;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                  }
                  .url-info {
                    margin-top: 15px;
                    padding: 10px;
                    background: #e8f4fd;
                    border-radius: 6px;
                    font-size: 12px;
                    word-break: break-all;
                    color: #666;
                  }
                  .print-btn {
                    margin-top: 20px;
                    padding: 12px 24px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                  }
                  .print-btn:hover {
                    background: #0056b3;
                  }
                  @media print {
                    body { background: white; }
                    .container { box-shadow: none; }
                    .print-btn { display: none; }
                    .url-info { display: none; }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                <h1>${data.venueName}</h1>
                <h2>${data.areaName} - ${data.tableLabel}</h2>
                  <div class="qr-container">
                    <img src="${data.qrCodeDataUrl}" alt="QR Code für ${data.tableLabel}" class="qr-code" />
                  </div>
                  <div class="url-info">
                    <strong>Test-URL:</strong> ${data.qrUrl}
                  </div>
                  <button onclick="window.print()" class="print-btn">
                    🖨️ Drucken
                  </button>
                </div>
              </body>
            </html>
          `);
        }
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (error) {
      alert('Fehler beim Generieren des QR-Codes');
    }
  };

  const createArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/admin/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAreaName.trim() }),
      });

      if (response.ok) {
        setNewAreaName('');
        setShowCreateArea(false);
        fetchTables(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Erstellen des Bereichs');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setCreating(false);
    }
  };

  const createTable = async (e: React.FormEvent, areaId: string) => {
    e.preventDefault();
    if (!newTableLabel.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          areaId, 
          label: newTableLabel.trim() 
        }),
      });

      if (response.ok) {
        setNewTableLabel('');
        setShowCreateTable(null);
        fetchTables(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Erstellen des Tisches');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Lade Tische...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
          <h1 className="text-3xl font-bold text-gray-900">Tischverwaltung</h1>
          <p className="mt-2 text-gray-600">Verwalten Sie Ihre Tische und generieren Sie QR-Codes</p>
          </div>
          <button
            onClick={() => setShowCreateArea(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Neuer Bereich
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Create Area Modal */}
        {showCreateArea && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Neuen Bereich erstellen</h3>
              <form onSubmit={createArea}>
                <div className="mb-4">
                  <label htmlFor="areaName" className="block text-sm font-medium text-gray-700 mb-2">
                    Bereichsname
                  </label>
                  <input
                    type="text"
                    id="areaName"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. Hauptraum, Terrasse"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateArea(false);
                      setNewAreaName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? 'Erstellt...' : 'Erstellen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {areas.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🪑</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Noch keine Bereiche angelegt</h2>
            <p className="text-lg text-gray-600 mb-6">
              Erstellen Sie zuerst Bereiche und Tische, um QR-Codes für Ihre Gäste zu generieren.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                <strong>Schritt 1:</strong> Erstellen Sie Bereiche (z.B. "Hauptraum", "Terrasse")<br/>
                <strong>Schritt 2:</strong> Fügen Sie Tische zu den Bereichen hinzu<br/>
                <strong>Schritt 3:</strong> Generieren Sie QR-Codes für jeden Tisch
              </p>
              <button
                onClick={() => setShowCreateArea(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Ersten Bereich anlegen
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {areas.map((area) => (
              <div key={area.id} className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                  <h2 className="text-xl font-semibold text-gray-900">{area.name}</h2>
                  <p className="text-sm text-gray-600">{area.tables.length} Tisch{area.tables.length !== 1 ? 'e' : ''}</p>
                  </div>
                  <button
                    onClick={() => setShowCreateTable(area.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    + Tisch hinzufügen
                  </button>
                </div>
                
                <div className="p-6">
                  {area.tables.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Keine Tische in diesem Bereich</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {area.tables.map((table) => (
                        <div key={table.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900">{table.label}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {table.qrToken.substring(0, 8)}...
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <button
                              onClick={() => getQRCode(table.id)}
                              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              QR-Code anzeigen
                            </button>
                            
                            <button
                              onClick={() => rotateToken(table.id)}
                              disabled={rotatingToken === table.id}
                              className="w-full bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
                            >
                              {rotatingToken === table.id ? 'Rotiert...' : 'Token rotieren'}
                            </button>
                          </div>
                          
                          <div className="mt-3 text-xs text-gray-500">
                            <p><strong>Token:</strong> {table.qrToken}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Table Modal */}
        {showCreateTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Neuen Tisch erstellen</h3>
              <form onSubmit={(e) => createTable(e, showCreateTable)}>
                <div className="mb-4">
                  <label htmlFor="tableLabel" className="block text-sm font-medium text-gray-700 mb-2">
                    Tischbezeichnung
                  </label>
                  <input
                    type="text"
                    id="tableLabel"
                    value={newTableLabel}
                    onChange={(e) => setNewTableLabel(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. T1, Tisch 5, Fensterplatz"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateTable(null);
                      setNewTableLabel('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {creating ? 'Erstellt...' : 'Erstellen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}