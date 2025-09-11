'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  // Nur auf Admin-Seiten anzeigen
  if (!pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin" 
            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            🍽️ SmartOrder Admin
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            href="/admin/tables" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Tische
          </Link>
          <Link 
            href="/admin/categories" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Kategorien
          </Link>
          <Link 
            href="/admin/items/new" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Artikel
          </Link>
          <Link 
            href="/admin/settings" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Einstellungen
          </Link>
        </div>
      </div>
    </nav>
  );
}
