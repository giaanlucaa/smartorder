'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';

interface Venue {
  id: string;
  name: string;
  themeColor?: string;
  logoUrl?: string;
}

interface DashboardStats {
  activeTables: number;
  todaysOrders: number;
  todaysRevenue: number;
  menuItems: number;
}

export default function AdminPage() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
          activeTables: 0,
          todaysOrders: 0,
          todaysRevenue: 0,
          menuItems: 0
        });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load venue info
        const venueResponse = await fetch('/api/admin/auth/me');
        if (venueResponse.ok) {
          const venueData = await venueResponse.json();
          setVenue(venueData.venue);
        } else if (venueResponse.status === 401) {
          router.push('/admin/auth/login');
          return;
        }

        // Load dashboard stats
        const statsResponse = await fetch('/api/admin/dashboard/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
      }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard" subtitle="Restaurant-Verwaltung">
        <div className="dashboard-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Dashboard" subtitle="Restaurant-Verwaltung">
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="dashboard-card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Heutige Bestellungen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todaysOrders}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Heutiger Umsatz</p>
                <p className="text-2xl font-bold text-gray-900">CHF {(stats.todaysRevenue || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">🏷️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktive Tische</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeTables}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">🍽️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Menü-Artikel</p>
                <p className="text-2xl font-bold text-gray-900">{stats.menuItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/tables" className="dashboard-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">🏷️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tische verwalten</h3>
                <p className="text-sm text-gray-600">QR-Codes generieren und Tische einrichten</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/categories" className="dashboard-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">📂</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Kategorien</h3>
                <p className="text-sm text-gray-600">Menü-Kategorien verwalten</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/items" className="dashboard-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">➕</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Artikel</h3>
                <p className="text-sm text-gray-600">Menü-Artikel hinzufügen und bearbeiten</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/accounting" className="dashboard-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
                </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Buchhaltung</h3>
                <p className="text-sm text-gray-600">Umsätze und Bestellungen analysieren</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/settings" className="dashboard-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <span className="text-2xl">⚙️</span>
                </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Einstellungen</h3>
                <p className="text-sm text-gray-600">Restaurant-Informationen verwalten</p>
              </div>
            </div>
          </Link>

          <Link href="/kitchen" className="dashboard-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <span className="text-2xl">🍳</span>
                </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Küchen-Display</h3>
                <p className="text-sm text-gray-600">Bestellungen in der Küche anzeigen</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Welcome Message */}
        <div className="dashboard-card p-6">
          <h2 className="text-xl font-bold mb-4">Willkommen im Admin-Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Verwalten Sie Ihr Restaurant mit unserem intelligenten Bestellsystem. 
            Hier haben Sie einen Überblick über alle wichtigen Kennzahlen und können 
            schnell zu den verschiedenen Verwaltungsbereichen navigieren.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">📱 QR-Code Bestellung</h3>
              <p className="text-sm text-blue-600">
                Gäste bestellen direkt am Tisch über QR-Codes. Einfach scannen und bestellen!
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🍳 Küchen-Display</h3>
              <p className="text-sm text-green-600">
                Bestellungen werden automatisch an die Küche übertragen und in Echtzeit angezeigt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}