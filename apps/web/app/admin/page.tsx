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

export default function Admin() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        console.error('Failed to load dashboard stats');
        // Set default values if API fails
        setStats({
          activeTables: 0,
          todaysOrders: 0,
          todaysRevenue: 0,
          menuItems: 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Set default values if API fails
      setStats({
        activeTables: 0,
        todaysOrders: 0,
        todaysRevenue: 0,
        menuItems: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Lade Statistiken...">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lade Dashboard...</h2>
            <p className="text-gray-600">Bitte warten Sie einen Moment</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Willkommen zurück!">
      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktive Tische</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats ? stats.activeTables : '...'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Heutige Bestellungen</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats ? stats.todaysOrders : '...'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Umsatz heute</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats ? `€${stats.todaysRevenue.toFixed(2)}` : '...'}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="dashboard-card p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Menü-Artikel</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats ? stats.menuItems : '...'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="dashboard-card p-8 mb-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Willkommen bei SmartOrder! 🎉
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Nutzen Sie die Seitenleiste, um durch die verschiedenen Bereiche Ihres Restaurants zu navigieren.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="p-4 bg-blue-100 rounded-xl w-fit mx-auto mb-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Schnell starten</h3>
                <p className="text-sm text-gray-600">Erstellen Sie Ihre ersten Tische und Menü-Artikel</p>
              </div>
              <div className="text-center">
                <div className="p-4 bg-green-100 rounded-xl w-fit mx-auto mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Einfach zu bedienen</h3>
                <p className="text-sm text-gray-600">Intuitive Navigation für alle Restaurant-Funktionen</p>
              </div>
              <div className="text-center">
                <div className="p-4 bg-purple-100 rounded-xl w-fit mx-auto mb-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Echtzeit-Daten</h3>
                <p className="text-sm text-gray-600">Aktuelle Statistiken und Bestellungen in Echtzeit</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
