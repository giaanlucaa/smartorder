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
      <main className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: venue?.themeColor || '#3B82F6' }}></div>
          <h1 className="text-2xl font-bold mb-2">Lade Menü...</h1>
          <p className="text-gray-600">Bitte warten Sie einen Moment</p>
        </div>
      </main>
    );
  }

  // Handle case where venue doesn't exist
  if (!venue) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Restaurant nicht gefunden</h1>
          <p className="text-lg text-gray-600 mb-8">
            Das gesuchte Restaurant existiert nicht oder ist nicht verfügbar.
          </p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      {/* Venue Header */}
      {venue && (
        <div className="text-center mb-8">
          {venue.logoUrl && (
            <img 
              src={venue.logoUrl} 
              alt={venue.name} 
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold mb-2" style={{ color: venue.themeColor || '#111827' }}>
            {venue.name}
          </h1>
          {venue.address && (
            <p className="text-gray-600">{venue.address}</p>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Menü</h2>
        <Link href="/" className="text-blue-600 hover:underline">Zurück</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu */}
        <div className="lg:col-span-2">
          {menu.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Noch kein Menü hinterlegt</h2>
              <p className="text-lg text-gray-600 mb-8">
                Das Restaurant hat noch keine Menü-Artikel hinzugefügt. 
                Bitte wenden Sie sich an das Personal.
              </p>
            </div>
          ) : (
            menu.map((category) => (
              <section key={category.id} className="mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">{category.name}</h2>
                <div className="grid gap-4">
                  {category.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Keine Artikel in dieser Kategorie</p>
                    </div>
                  ) : (
                    category.items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            {item.description && (
                              <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                            )}
                            {item.allergens.length > 0 && (
                              <p className="text-xs text-red-600 mt-1">
                                Allergene: {item.allergens.join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{venue.currency} {Number(item.price).toFixed(2)}</div>
                            <button
                              onClick={() => addToCart(item)}
                              className="mt-2 text-white px-4 py-2 rounded transition-colors hover:opacity-90"
                              style={{ 
                                backgroundColor: venue?.themeColor || '#3B82F6'
                              }}
                            >
                              Hinzufügen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 bg-white border rounded-lg p-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Warenkorb</h3>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Warenkorb ist leer</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <div key={item.itemId} className="flex justify-between items-center border-b pb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-600">{venue.currency} {Number(item.price).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.itemId, item.qty - 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQuantity(item.itemId, item.qty + 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.itemId)}
                          className="ml-2 text-red-600 hover:text-red-800 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Gesamt:</span>
                    <span className="font-bold text-lg">{venue.currency} {Number(getCartTotal()).toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={proceedToCheckout}
                    className="w-full text-white py-3 rounded-lg font-semibold transition-colors hover:opacity-90"
                    style={{ 
                      backgroundColor: venue?.themeColor || '#16A34A'
                    }}
                  >
                    Bezahlen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
