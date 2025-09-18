'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  allergens?: string[];
  imageUrl?: string;
  category: Category;
}

export default function ItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
    allergens: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/admin/items'),
        fetch('/api/admin/categories')
      ]);

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setItems(itemsData.items || []);
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }
    } catch (error) {
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : []
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        await fetchData();
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (error) {
      alert('Fehler beim Erstellen des Artikels');
    } finally {
      setCreating(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setCreating(true);

    try {
      const response = await fetch(`/api/admin/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : []
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingItem(null);
        resetForm();
        await fetchData();
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (error) {
      alert('Fehler beim Aktualisieren des Artikels');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Artikel löschen möchten?')) return;

    try {
      const response = await fetch(`/api/admin/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (error) {
      alert('Fehler beim Löschen des Artikels');
    }
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (response.ok) {
        await fetchData();
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (error) {
      alert('Fehler beim Ändern der Verfügbarkeit');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      isAvailable: true,
      allergens: '',
      imageUrl: ''
    });
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.categoryId,
      isAvailable: item.isAvailable,
      allergens: item.allergens ? item.allergens.join(', ') : '',
      imageUrl: item.imageUrl || ''
    });
    setShowEditModal(true);
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.categoryId === selectedCategory);

  if (loading) {
    return (
      <AdminLayout title="Artikel verwalten" subtitle="Menü-Artikel hinzufügen und bearbeiten">
        <div className="dashboard-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Artikel...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Artikel verwalten" subtitle="Menü-Artikel hinzufügen und bearbeiten">
        <div className="dashboard-card p-8 text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Artikel verwalten" subtitle="Menü-Artikel hinzufügen und bearbeiten">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold modern-title">Artikel verwalten</h1>
            <p className="text-gray-600 modern-subtitle">Fügen Sie neue Menü-Artikel hinzu oder bearbeiten Sie bestehende</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="modern-button px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
          >
            ➕ Neuer Artikel
          </button>
        </div>

        {/* Category Filter */}
        <div className="dashboard-card p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Kategorie filtern:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Kategorien</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="dashboard-card p-8 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Noch keine Artikel vorhanden</h2>
            <p className="text-lg text-gray-600 mb-6">
              Erstellen Sie Ihren ersten Menü-Artikel, um loszulegen.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="modern-button px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Ersten Artikel erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="modern-card rounded-lg overflow-hidden">
                {item.imageUrl && (
                  <div className="h-48 bg-gray-200">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.category.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          item.isAvailable
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {item.isAvailable ? 'Verfügbar' : 'Nicht verfügbar'}
                      </button>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  )}

                  {item.allergens && item.allergens.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Allergene:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.map((allergen, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">CHF {item.price.toFixed(2)}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Item Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="dashboard-card p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Neuen Artikel erstellen</h3>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Artikelname *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preis (CHF) *
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorie *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Kategorie wählen</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergene (durch Komma getrennt)
                  </label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    placeholder="z.B. Gluten, Milch, Nüsse"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bild-URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
                    Artikel ist verfügbar
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 modern-button-secondary py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 modern-button py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    {creating ? 'Erstellt...' : 'Erstellen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="dashboard-card p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Artikel bearbeiten</h3>
              <form onSubmit={handleEditItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Artikelname *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preis (CHF) *
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorie *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Kategorie wählen</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergene (durch Komma getrennt)
                  </label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    placeholder="z.B. Gluten, Milch, Nüsse"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bild-URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailableEdit"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailableEdit" className="ml-2 block text-sm text-gray-700">
                    Artikel ist verfügbar
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 modern-button-secondary py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 modern-button py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    {creating ? 'Speichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
