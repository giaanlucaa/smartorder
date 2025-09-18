'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';

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
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<{dataUrl: string, tableLabel: string, qrUrl: string} | null>(null);
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
        
        // Set QR data and show modal
        setQrData({
          dataUrl: data.qrCodeDataUrl,
          tableLabel: data.tableLabel,
          qrUrl: data.qrUrl
        });
        setShowQRModal(true);
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
      <AdminLayout title="Tischverwaltung" subtitle="Lade Tische...">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lade Tische...</h2>
            <p className="text-gray-600">Bitte warten Sie einen Moment</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tischverwaltung" subtitle="Verwalten Sie Ihre Tische und generieren Sie QR-Codes">
      <div className="p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <button
              onClick={() => setShowCreateArea(true)}
              className="modern-button px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              + Neuer Bereich
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Create Area Modal */}
        {showCreateArea && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modern-card rounded-lg p-6 w-full max-w-md">
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
                    className="px-4 py-2 modern-button-secondary rounded-md"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 modern-button rounded-md disabled:opacity-50"
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
                className="modern-button px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Ersten Bereich anlegen
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {areas.map((area) => (
              <div key={area.id} className="modern-card rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                  <h2 className="text-xl font-semibold text-gray-900">{area.name}</h2>
                  <p className="text-sm text-gray-600">{area.tables.length} Tisch{area.tables.length !== 1 ? 'e' : ''}</p>
                  </div>
                  <button
                    onClick={() => setShowCreateTable(area.id)}
                    className="modern-button-success px-3 py-1 rounded text-sm transition-colors"
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
                              className="w-full modern-button px-3 py-2 rounded text-sm transition-colors"
                            >
                              QR-Code anzeigen
                            </button>
                            
                            <button
                              onClick={() => rotateToken(table.id)}
                              disabled={rotatingToken === table.id}
                              className="w-full modern-button-secondary px-3 py-2 rounded text-sm transition-colors disabled:opacity-50"
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
            <div className="modern-card rounded-lg p-6 w-full max-w-md">
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
                    className="px-4 py-2 modern-button-secondary rounded-md"
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

        {/* QR Code Modal */}
        {showQRModal && qrData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="dashboard-card p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold modern-title">QR-Code</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="text-center">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">{qrData.tableLabel}</h4>
                  <p className="text-sm text-gray-600">Scannen Sie diesen QR-Code mit Ihrem Smartphone</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-6">
                  <img 
                    src={qrData.dataUrl} 
                    alt={`QR Code für ${qrData.tableLabel}`}
                    className="mx-auto max-w-full h-auto"
                  />
                </div>
                
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">🔗 Test-URL:</h5>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={qrData.qrUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-xs bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(qrData.qrUrl);
                        alert('URL in Zwischenablage kopiert!');
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      📋 Kopieren
                    </button>
                    <button
                      onClick={() => window.open(qrData.qrUrl, '_blank')}
                      className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      🔗 Öffnen
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 modern-button-secondary py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  >
                    🖨️ Drucken
                  </button>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="flex-1 modern-button py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}