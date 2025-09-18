'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Venue {
  id: string;
  name: string;
  themeColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  currency: string;
  address?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  taxRate: number;
  allergens: string[];
  imageUrl?: string;
  options?: OptionGroup[];
}

interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  choices: OptionChoice[];
}

interface OptionChoice {
  id: string;
  label: string;
  priceDiff: number;
}

interface MenuCategory {
  id: string;
  name: string;
  position: number;
  items: MenuItem[];
}

interface CartItem {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  modifiers: Record<string, string[]>;
  totalPrice: number;
}

export default function Page({ params }: { params: { venueId: string; tableToken: string } }) {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Use relative URLs for better compatibility
        const venueResponse = await fetch(`/api/venue/public?venue=${params.venueId}`);
        if (venueResponse.ok) {
          const venueData = await venueResponse.json();
          setVenue(venueData);
        }
        
        // Fetch menu data
        const menuResponse = await fetch(`/api/menu?venue=${params.venueId}`);
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenu(menuData.categories || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.venueId]);

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.itemId === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.itemId === item.id 
          ? { ...cartItem, qty: cartItem.qty + 1, totalPrice: (cartItem.qty + 1) * Number(item.price) }
          : cartItem
      ));
    } else {
      const newCartItem: CartItem = {
        itemId: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        modifiers: {},
        totalPrice: Number(item.price)
      };
      setCart([...cart, newCartItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.itemId !== itemId));
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(cart.map(item => 
      item.itemId === itemId 
        ? { ...item, qty: newQty, totalPrice: newQty * Number(item.price) }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) return;
    
    const cartData = encodeURIComponent(JSON.stringify(cart));
    window.location.href = `/checkout?venueId=${params.venueId}&tableToken=${params.tableToken}&cart=${cartData}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen modern-gradient-subtle">
        <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="dashboard-card p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500 mx-auto mb-6"></div>
            <h1 className="text-3xl font-bold mb-4 modern-title">Lade Menü...</h1>
            <p className="text-lg text-gray-600 modern-subtitle">Bitte warten Sie einen Moment</p>
            <div className="mt-6 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Handle case where venue doesn't exist
  if (!venue) {
    return (
      <main className="min-h-screen modern-gradient-subtle">
        <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="dashboard-card p-12 text-center max-w-md">
            <div className="text-8xl mb-6">🏪</div>
            <h1 className="text-3xl font-bold mb-4 modern-title">Restaurant nicht gefunden</h1>
            <p className="text-lg text-gray-600 mb-8 modern-subtitle">
              Das gesuchte Restaurant existiert nicht oder ist nicht verfügbar.
            </p>
            <Link 
              href="/"
              className="modern-button px-8 py-4 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              🏠 Zur Startseite
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen modern-gradient-subtle">
      <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
      <div className="relative z-10 max-w-6xl mx-auto p-4">
        {/* Venue Header */}
        {venue && (
          <div className="text-center mb-8">
            {venue.logoUrl && (
              <img 
                src={venue.logoUrl} 
                alt={venue.name} 
                className="h-20 mx-auto mb-4 rounded-xl shadow-lg"
              />
            )}
            <h1 className="text-4xl font-bold mb-2 modern-title" style={{ color: venue.themeColor || '#111827' }}>
              {venue.name}
            </h1>
            {venue.address && (
              <p className="text-gray-600 modern-subtitle">{venue.address}</p>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold modern-title">Menü</h2>
          <Link 
            href="/" 
            className="modern-button-secondary px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
          >
            ← Zurück
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu */}
        <div className="lg:col-span-2">
          {menu.length === 0 ? (
            <div className="dashboard-card text-center py-16">
              <div className="text-8xl mb-6">🍽️</div>
              <h2 className="text-3xl font-bold mb-4 text-gray-800">Noch kein Menü hinterlegt</h2>
              <p className="text-lg text-gray-600 mb-8">
                Das Restaurant hat noch keine Menü-Artikel hinzugefügt. 
                Bitte wenden Sie sich an das Personal.
              </p>
            </div>
          ) : (
            menu.map((category) => (
              <section key={category.id} className="mb-10">
                <div className="dashboard-card p-6">
                  <h2 className="text-2xl font-bold mb-6 modern-title border-b-2 pb-3" style={{ borderColor: venue?.themeColor || '#3B82F6' }}>
                    {category.name}
                  </h2>
                  <div className="grid gap-6">
                    {category.items.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-3">📝</div>
                        <p className="text-lg">Keine Artikel in dieser Kategorie</p>
                      </div>
                    ) : (
                      category.items.map((item) => (
                        <div key={item.id} className="modern-card p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-bold text-xl mb-2 modern-title">{item.name}</h3>
                              {item.description && (
                                <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                              )}
                              {item.allergens.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {item.allergens.map((allergen, index) => (
                                    <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                      {allergen}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-6">
                              <div className="font-bold text-2xl mb-3" style={{ color: venue?.themeColor || '#111827' }}>
                                {venue.currency} {Number(item.price).toFixed(2)}
                              </div>
                              <button
                                onClick={() => addToCart(item)}
                                className="modern-button px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                                style={{ 
                                  backgroundColor: venue?.themeColor || '#3B82F6'
                                }}
                              >
                                + Hinzufügen
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            ))
          )}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 dashboard-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold modern-title">Warenkorb</h3>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-gray-500 text-lg">Warenkorb ist leer</p>
                <p className="text-gray-400 text-sm mt-2">Fügen Sie Artikel hinzu</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.itemId} className="modern-card p-4 hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-lg modern-title">{item.name}</div>
                          <div className="text-sm text-gray-600">{venue.currency} {Number(item.price).toFixed(2)}</div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.itemId)}
                          className="text-red-500 hover:text-red-700 text-lg transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateQuantity(item.itemId, item.qty - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-lg font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-bold text-lg">{item.qty}</span>
                          <button
                            onClick={() => updateQuantity(item.itemId, item.qty + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-lg font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="font-bold text-lg" style={{ color: venue?.themeColor || '#111827' }}>
                          {venue.currency} {Number(item.totalPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t-2 pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-bold modern-title">Gesamt:</span>
                    <span className="font-bold text-2xl" style={{ color: venue?.themeColor || '#111827' }}>
                      {venue.currency} {Number(getCartTotal()).toFixed(2)}
                    </span>
                  </div>
                  
                  <button
                    onClick={proceedToCheckout}
                    className="w-full modern-button-success py-4 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    💳 Bezahlen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
