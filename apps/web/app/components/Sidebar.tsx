'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  venue?: {
    id: string;
    name: string;
    themeColor?: string;
    logoUrl?: string;
  };
  collapsed?: boolean;
}

export default function Sidebar({ venue, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const navigationItems = [
    {
      title: 'Menüverwaltung',
      description: 'Artikel, Kategorien und Preise verwalten',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      items: [
        {
          name: 'Kategorien verwalten',
          href: '/admin/categories',
          icon: '📂',
          isActive: pathname.startsWith('/admin/categories')
        },
        {
          name: 'Artikel verwalten',
          href: '/admin/items',
          icon: '📝',
          isActive: pathname.startsWith('/admin/items')
        },
        {
          name: 'Neuen Artikel anlegen',
          href: '/admin/items/new',
          icon: '➕',
          isActive: pathname === '/admin/items/new'
        }
      ]
    },
    {
      title: 'Tischverwaltung',
      description: 'Tische, Bereiche und QR-Codes verwalten',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      items: [
        {
          name: 'Tische & QR-Codes',
          href: '/admin/tables',
          icon: '🏷️',
          isActive: pathname.startsWith('/admin/tables')
        }
      ]
    },
    {
      title: 'Bestellungen',
      description: 'Bestellungsverwaltung und Kitchen Display',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      items: [
        {
          name: 'Bestellungen verwalten',
          href: '/kitchen',
          icon: '📋',
          isActive: pathname === '/kitchen'
        },
        {
          name: 'Kitchen Display',
          href: '/kitchen/browser',
          icon: '🖥️',
          isActive: pathname.startsWith('/kitchen/browser')
        }
      ]
    },
    {
      title: 'Finanzen',
      description: 'Buchhaltung und Umsatzübersicht',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      items: [
        {
          name: 'Buchhaltung',
          href: '/admin/accounting',
          icon: '📊',
          isActive: pathname.startsWith('/admin/accounting')
        }
      ]
    },
    {
      title: 'Restaurant-Einstellungen',
      description: 'Branding, Logo und Theme anpassen',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      items: [
        {
          name: 'Einstellungen öffnen',
          href: '/admin/settings',
          icon: '⚙️',
          isActive: pathname.startsWith('/admin/settings')
        }
      ]
    },
    {
      title: 'Gästeansicht',
      description: 'Vorschau und Test der Gästeansicht',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      items: [
        {
          name: 'Vorschau testen',
          href: '/admin/tables',
          icon: '👁️',
          isActive: false
        }
      ]
    }
  ];

  return (
    <div className={`${collapsed ? 'w-16' : 'w-96'} bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 h-full overflow-y-auto shadow-lg transition-all duration-300`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">SmartOrder</h1>
            <p className="text-sm text-gray-300">Admin Dashboard</p>
          </div>
        </div>
        
        {venue && (
          <div className="flex items-center space-x-3 px-3 py-2 bg-gray-700/60 backdrop-blur-sm rounded-xl border border-gray-600">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: venue.themeColor || '#3B82F6' }}
              ></div>
              <span className="text-sm font-semibold text-gray-200">
                {venue.name}
              </span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        )}
        
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-2">
        {navigationItems.map((section, index) => {
          const isExpanded = expandedSections[section.title];
          const hasActiveItem = section.items.some(item => item.isActive);
          
          return (
            <div key={index} className="mb-4">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-start space-x-3 mb-2 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className={`p-2 bg-gradient-to-br ${section.color} rounded-lg shadow-sm flex-shrink-0`}>
                  <div className="text-white">
                    {section.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-semibold text-white text-sm leading-tight">{section.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">{section.description}</p>
                </div>
                <div className="flex-shrink-0 mt-1">
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 ease-in-out ${
                      isExpanded ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-1 ml-11 pt-2">
                  {section.items.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        item.isActive
                          ? `${section.bgColor} ${section.textColor} shadow-sm`
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-300">System online</span>
          </div>
          <div className="text-xs text-gray-400">
            v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
