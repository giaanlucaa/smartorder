'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Venue {
  id: string;
  name: string;
  themeColor?: string;
  logoUrl?: string;
  currency?: string;
}

export default function Admin() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingTenant, setSwitchingTenant] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [authResponse, venuesResponse] = await Promise.all([
        fetch('/api/admin/auth/me'),
        fetch('/api/admin/venues')
      ]);
      
      if (authResponse.ok) {
        const data = await authResponse.json();
        setVenue(data.venue);
      } else if (authResponse.status === 401) {
        router.push('/admin/auth/login');
        return;
      }
      
      if (venuesResponse.ok) {
        const venuesData = await venuesResponse.json();
        setVenues(venuesData.venues || []);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const switchTenant = async (venueId: string) => {
    if (venueId === venue?.id) return; // Already selected
    
    setSwitchingTenant(true);
    try {
      const response = await fetch('/api/admin/tenant/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId })
      });
      
      if (response.ok) {
        // Reload the page to get the new tenant context
        window.location.reload();
      } else {
        console.error('Failed to switch tenant');
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
    } finally {
      setSwitchingTenant(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Lade Dashboard...</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">Fehler beim Laden des Dashboards</div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          {venue.logoUrl && (
            <img src={venue.logoUrl} alt={venue.name} className="h-12 w-12 object-contain" />
          )}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: venue.themeColor || '#111827' }}>
              {venue.name}
            </h1>
            <p className="text-gray-600">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {venues.length > 1 && (
            <div className="relative">
              <select
                value={venue?.id || ''}
                onChange={(e) => switchTenant(e.target.value)}
                disabled={switchingTenant}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {switchingTenant && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          )}
          <Link 
            href="/admin/settings"
            className="text-gray-600 hover:text-gray-900"
          >
            Einstellungen
          </Link>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800"
          >
            Abmelden
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Menüverwaltung</h2>
          <p className="text-gray-600 mb-4">Artikel, Kategorien und Preise verwalten</p>
          <div className="space-y-2">
            <Link 
              href="/admin/categories"
              className="text-white px-4 py-2 rounded-lg transition-colors inline-block w-full text-center"
              style={{ backgroundColor: venue.themeColor || '#3B82F6' }}
            >
              Kategorien verwalten
            </Link>
            <Link 
              href="/admin/items/new"
              className="text-white px-4 py-2 rounded-lg transition-colors inline-block w-full text-center"
              style={{ backgroundColor: venue.themeColor || '#8B5CF6' }}
            >
              Neuen Artikel anlegen
            </Link>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Tischverwaltung</h2>
          <p className="text-gray-600 mb-4">Tische, Bereiche und QR-Codes verwalten</p>
          <div className="space-y-2">
            <Link 
              href="/admin/tables"
              className="text-white px-4 py-2 rounded-lg transition-colors inline-block w-full text-center"
              style={{ backgroundColor: venue.themeColor || '#16A34A' }}
            >
              Tische & QR-Codes
            </Link>
            <Link 
              href="/kitchen"
              className="text-white px-4 py-2 rounded-lg transition-colors inline-block w-full text-center"
              style={{ backgroundColor: '#DC2626' }}
            >
              🍽️ Kitchen Dashboard
            </Link>
            <Link 
              href="/admin/accounting"
              className="text-white px-4 py-2 rounded-lg transition-colors inline-block w-full text-center"
              style={{ backgroundColor: '#059669' }}
            >
              📊 Buchhaltung
            </Link>
          </div>
        </div>


        <div className="bg-white border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Restaurant-Einstellungen</h2>
          <p className="text-gray-600 mb-4">Branding, Logo und Theme anpassen</p>
          <Link 
            href="/admin/settings"
            className="text-white px-4 py-2 rounded-lg transition-colors inline-block"
            style={{ backgroundColor: venue.themeColor || '#7C3AED' }}
          >
            Einstellungen
          </Link>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Bestellungen</h2>
          <p className="text-gray-600 mb-4">Alle Bestellungen einsehen und verwalten</p>
          <Link 
            href="/admin/orders"
            className="text-white px-4 py-2 rounded-lg transition-colors inline-block"
            style={{ backgroundColor: venue.themeColor || '#DC2626' }}
          >
            Bestellungen
          </Link>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Vorschau</h2>
          <p className="text-gray-600 mb-4">Gästeansicht testen</p>
          <p className="text-sm text-gray-500 mb-4">
            Erstellen Sie zuerst einen Tisch mit QR-Code, um die Gästeansicht zu testen.
          </p>
          <Link 
            href="/admin/tables"
            className="text-white px-4 py-2 rounded-lg transition-colors inline-block"
            style={{ backgroundColor: venue.themeColor || '#0891B2' }}
          >
            Tische verwalten
          </Link>
        </div>
      </div>
    </main>
  );
}
