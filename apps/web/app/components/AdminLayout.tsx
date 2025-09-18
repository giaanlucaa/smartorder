'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CollapsibleSidebar from './CollapsibleSidebar';

interface Venue {
  id: string;
  name: string;
  themeColor?: string;
  logoUrl?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ 
  children, 
  showSidebar = true, 
  title,
  subtitle 
}: AdminLayoutProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/me');
      if (response.ok) {
        const data = await response.json();
        setVenue(data.venue);
      } else if (response.status === 401) {
        router.push('/admin/auth/login');
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

  if (loading) {
    return (
      <div className="min-h-screen modern-gradient-subtle flex items-center justify-center">
        <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lade Dashboard...</h2>
          <p className="text-gray-600">Bitte warten Sie einen Moment</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen modern-gradient-subtle flex items-center justify-center">
        <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10 text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Fehler beim Laden des Dashboards</h2>
          <p className="text-gray-600">Bitte versuchen Sie es später erneut</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen modern-gradient-subtle">
      <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        {showSidebar && (
          <div className={`transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-96'}`}>
            <CollapsibleSidebar venue={venue} collapsed={sidebarCollapsed} />
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <div className="dashboard-header px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Sidebar Toggle Button */}
                {showSidebar && (
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}
                
                {venue?.logoUrl && (
                  <div className="relative">
                    <img 
                      src={venue.logoUrl} 
                      alt={venue.name} 
                      className="h-12 w-12 object-contain rounded-xl shadow-lg" 
                    />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold modern-title">
                    {title || venue?.name || 'Restaurant Dashboard'}
                  </h1>
                  <p className="text-sm modern-subtitle">
                    {subtitle || 'Willkommen zurück!'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin/settings')}
                  className="modern-button-secondary px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 text-sm"
                >
                  ⚙️ Einstellungen
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:scale-105 shadow-lg text-sm"
                >
                  🚪 Abmelden
                </button>
              </div>
            </div>
          </div>
          
          {/* Page Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
