'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Venue {
  id: string;
  name: string;
  slug: string;
  themeColor?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const [currentVenue, setCurrentVenue] = useState<Venue | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Only load user data on admin pages
    if (!pathname.startsWith('/admin')) {
      return;
    }
    
    // Load current user and venue data
    const loadUserData = async () => {
      try {
        const userResponse = await fetch('/api/admin/auth/me');
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          setCurrentVenue(userData.venue);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, [pathname]);
  
  // Navigation komplett deaktiviert - wird überall ausgeblendet
  return null;


  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      window.location.href = '/admin/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="nav-modern px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link 
            href="/admin" 
            className="flex items-center space-x-3 text-xl font-bold text-gray-900 hover:text-blue-600 transition-all duration-300 hover:scale-105"
          >
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span>SmartOrder Admin</span>
          </Link>
          {currentVenue && (
            <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: currentVenue.themeColor || '#3B82F6' }}
                ></div>
                <span className="text-sm font-semibold text-gray-700">
                  {currentVenue.name}
                </span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Link 
            href="/admin" 
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
              pathname === '/admin' 
                ? 'bg-blue-100 text-blue-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📊 Dashboard
          </Link>
          <Link 
            href="/admin/tables" 
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
              pathname.startsWith('/admin/tables') 
                ? 'bg-green-100 text-green-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🏷️ Tische
          </Link>
          <Link 
            href="/admin/categories" 
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
              pathname.startsWith('/admin/categories') 
                ? 'bg-purple-100 text-purple-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📂 Kategorien
          </Link>
          <Link 
            href="/admin/items/new" 
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
              pathname.startsWith('/admin/items') 
                ? 'bg-orange-100 text-orange-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            ➕ Artikel
          </Link>
          <Link 
            href="/admin/settings" 
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
              pathname.startsWith('/admin/settings') 
                ? 'bg-gray-100 text-gray-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            ⚙️ Einstellungen
          </Link>
          
          <div className="w-px h-8 bg-gray-300 mx-2"></div>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300 hover:scale-105"
          >
            🚪 Abmelden
          </button>
        </div>
      </div>
    </nav>
  );
}
