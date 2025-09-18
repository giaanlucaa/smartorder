'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout';

interface MenuCategory {
  id: string;
  name: string;
}

export default function NewMenuItemPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryName: '',
    taxRate: '8.1',
    allergens: '',
    imageUrl: '',
  });

  useEffect(() => {
    fetchCategories();
    checkForEditMode();
  }, []);

  const checkForEditMode = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const edit = urlParams.get('edit');
      const id = urlParams.get('id');
      
      if (edit === 'true' && id) {
        setIsEditing(true);
        setEditingItemId(id);
        
        // Pre-fill form with URL parameters
        const name = urlParams.get('name') || '';
        const description = urlParams.get('description') || '';
        const price = urlParams.get('price') || '';
        const categoryId = urlParams.get('categoryId') || '';
        
        setFormData({
          name,
          description,
          price,
          categoryName: categoryId,
          taxRate: '8.1',
          allergens: '',
          imageUrl: '',
        });
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/venue');
      if (response.ok) {
        const venue = await response.json();
        // Fetch existing categories from the venue
        const categoriesResponse = await fetch('/api/admin/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories || []);
        } else {
          // No categories exist yet - show empty state
          setCategories([]);
        }
      } else if (response.status === 401) {
        router.push('/admin/auth/login');
      }
    } catch (error) {
      setError('Fehler beim Laden der Kategorien');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const allergensArray = formData.allergens
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const requestData = {
          name: formData.name,
          description: formData.description || undefined,
          price: parseFloat(formData.price),
          categoryName: formData.categoryName,
          taxRate: parseFloat(formData.taxRate),
          allergens: allergensArray,
          imageUrl: formData.imageUrl || undefined,
        isActive: true,
      };

      const url = isEditing && editingItemId 
        ? `/api/admin/items/${editingItemId}`
        : '/api/admin/items';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        if (isEditing) {
          setSuccess('Menüartikel erfolgreich aktualisiert!');
          // Redirect back to categories after successful edit
          setTimeout(() => {
            router.push('/admin/categories');
          }, 1500);
        } else {
          setSuccess('Menüartikel erfolgreich erstellt!');
          setFormData({
            name: '',
            description: '',
            price: '',
            categoryName: '',
            taxRate: '8.1',
            allergens: '',
            imageUrl: '',
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Fehler beim ${isEditing ? 'Aktualisieren' : 'Erstellen'} des Artikels`);
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setCreatingCategory(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories([...categories, newCategory]);
        setNewCategoryName('');
        setShowCreateCategory(false);
        setFormData({ ...formData, categoryName: newCategory.name });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Erstellen der Kategorie');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setCreatingCategory(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Neuer Menüartikel" subtitle="Lade Formular...">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lade Formular...</h2>
            <p className="text-gray-600">Bitte warten Sie einen Moment</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={isEditing ? 'Menüartikel bearbeiten' : 'Neuer Menüartikel'} 
      subtitle={isEditing ? 'Bearbeiten Sie den Artikel' : 'Erstellen Sie einen neuen Artikel für Ihr Menü'}
    >
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <button
                onClick={() => setShowCreateCategory(true)}
                className="modern-button-success px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                + Neue Kategorie
              </button>
            </div>
          </div>

        <div className="modern-card rounded-lg">
          <div className="px-6 py-5 sm:p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Artikel-Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="z.B. Pad Thai"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Beschreibung
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Kurze Beschreibung des Artikels..."
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Preis (CHF) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    step="0.05"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="12.50"
                  />
                </div>

                <div>
                  <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">
                    MwSt. (%) *
                  </label>
                  <input
                    type="number"
                    id="taxRate"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="8.1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
                  Kategorie *
                </label>
                {categories.length === 0 ? (
                  <div className="mt-1 p-4 border-2 border-dashed border-gray-300 rounded-md text-center">
                    <p className="text-sm text-gray-500 mb-2">Noch keine Kategorien vorhanden</p>
                    <p className="text-xs text-gray-400 mb-3">
                      Erstellen Sie zuerst eine Kategorie, bevor Sie Artikel hinzufügen können.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCreateCategory(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Erste Kategorie anlegen
                    </button>
                  </div>
                ) : (
                  <select
                    id="categoryName"
                    required
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Kategorie wählen</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="allergens" className="block text-sm font-medium text-gray-700">
                  Allergene
                </label>
                <input
                  type="text"
                  id="allergens"
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="z.B. Gluten, Nüsse, Milch (durch Komma getrennt)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Trennen Sie mehrere Allergene durch Kommas
                </p>
              </div>

              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                  Bild-URL
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 modern-button-secondary rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 modern-button rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving 
                    ? (isEditing ? 'Wird gespeichert...' : 'Wird erstellt...') 
                    : (isEditing ? 'Änderungen speichern' : 'Artikel erstellen')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Create Category Modal */}
        {showCreateCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modern-card rounded-lg p-6 w-full max-w-md">
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
                    className="px-4 py-2 modern-button-secondary rounded-md"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCategory}
                    className="px-4 py-2 modern-button-success rounded-md disabled:opacity-50"
                  >
                    {creatingCategory ? 'Erstellt...' : 'Erstellen'}
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