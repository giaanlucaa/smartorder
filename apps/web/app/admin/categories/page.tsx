'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';

interface MenuCategory {
  id: string;
  name: string;
  position: number;
  _count: {
    items: number;
  };
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [categoryItems, setCategoryItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState<MenuCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const formatPrice = (price: number): string => {
    return isNaN(price) ? '0.00' : price.toFixed(2);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else if (response.status === 401) {
        router.push('/admin/auth/login');
      } else {
        setError('Fehler beim Laden der Kategorien');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryItems = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/items`);
      if (response.ok) {
        const data = await response.json();
        setCategoryItems(data.items || []);
      } else {
        setError('Fehler beim Laden der Artikel');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (response.ok) {
        setNewCategoryName('');
        setShowCreateCategory(false);
        fetchCategories();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Erstellen der Kategorie');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setCreating(false);
    }
  };

  const updateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditCategory || !editingCategoryName.trim()) return;
    
    setEditing(true);
    try {
      const response = await fetch(`/api/admin/categories/${showEditCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategoryName.trim() }),
      });

      if (response.ok) {
        setEditingCategoryName('');
        setShowEditCategory(null);
        fetchCategories();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Aktualisieren der Kategorie');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setEditing(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten? Alle Artikel in dieser Kategorie werden ebenfalls gelöscht.')) {
      return;
    }

    setDeleting(categoryId);
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCategories();
        if (selectedCategory?.id === categoryId) {
          setSelectedCategory(null);
          setCategoryItems([]);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Löschen der Kategorie');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setDeleting(null);
    }
  };

  const handleCategorySelect = (category: MenuCategory) => {
    setSelectedCategory(category);
    fetchCategoryItems(category.id);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setShowEditCategory(category);
    setEditingCategoryName(category.name);
  };

  const handleEditItem = (item: MenuItem) => {
    // Navigate to edit page or open edit modal
    // For now, we'll navigate to the new item page with pre-filled data
    const params = new URLSearchParams({
      edit: 'true',
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: selectedCategory?.id || '',
    });
    window.location.href = `/admin/items/new?${params.toString()}`;
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Artikel löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the category items
        if (selectedCategory) {
          fetchCategoryItems(selectedCategory.id);
        }
        // Also refresh categories to update item counts
        fetchCategories();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Löschen des Artikels');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Kategorieverwaltung" subtitle="Lade Kategorien...">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lade Kategorien...</h2>
            <p className="text-gray-600">Bitte warten Sie einen Moment</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kategorieverwaltung" subtitle="Verwalten Sie Ihre Menükategorien und Artikel">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div className="flex space-x-3">
              <Link
                href="/admin/items/new"
                className="modern-button px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                + Neuer Artikel
              </Link>
              <button
                onClick={() => setShowCreateCategory(true)}
                className="modern-button-success px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                + Neue Kategorie
              </button>
            </div>
          </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories List */}
          <div className="lg:col-span-1">
            <div className="modern-card rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Kategorien</h2>
              </div>
              <div className="p-6">
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📂</div>
                    <p className="text-gray-500 mb-4">Noch keine Kategorien vorhanden</p>
                    <button
                      onClick={() => setShowCreateCategory(true)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Erste Kategorie erstellen
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCategory?.id === category.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleCategorySelect(category)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{category.name}</h3>
                            <p className="text-sm text-gray-500">
                              {category._count.items} Artikel
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCategory(category);
                              }}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Bearbeiten"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCategory(category.id);
                              }}
                              disabled={deleting === category.id}
                              className="text-gray-400 hover:text-red-600 p-1 disabled:opacity-50"
                              title="Löschen"
                            >
                              {deleting === category.id ? '⏳' : '🗑️'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Items */}
          <div className="lg:col-span-2">
            <div className="modern-card rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedCategory ? `${selectedCategory.name} - Artikel` : 'Artikel'}
                </h2>
              </div>
              <div className="p-6">
                {!selectedCategory ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🍽️</div>
                    <p className="text-gray-500">Wählen Sie eine Kategorie aus, um die Artikel anzuzeigen</p>
                  </div>
                ) : categoryItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-500 mb-4">Noch keine Artikel in dieser Kategorie</p>
                    <Link
                      href="/admin/items/new"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ersten Artikel erstellen
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900">{item.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.isActive ? 'Aktiv' : 'Inaktiv'}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            <p className="text-sm font-medium text-gray-900 mt-2">
                              CHF {formatPrice(item.price)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              title="Bearbeiten"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                              title="Löschen"
                            >
                              Löschen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Category Modal */}
        {showCreateCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Neue Kategorie erstellen</h3>
              <form onSubmit={createCategory}>
                <div className="mb-4">
                  <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
                    Kategoriename
                  </label>
                  <input
                    type="text"
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. Vorspeisen, Hauptgerichte, Getränke"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateCategory(false);
                      setNewCategoryName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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

        {/* Edit Category Modal */}
        {showEditCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Kategorie bearbeiten</h3>
              <form onSubmit={updateCategory}>
                <div className="mb-4">
                  <label htmlFor="editCategoryName" className="block text-sm font-medium text-gray-700 mb-2">
                    Kategoriename
                  </label>
                  <input
                    type="text"
                    id="editCategoryName"
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditCategory(null);
                      setEditingCategoryName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={editing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editing ? 'Wird gespeichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
}
