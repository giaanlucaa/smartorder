'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        setError('Fehler beim Laden der Kategorien');
      }
    } catch (error) {
      setError('Fehler beim Laden der Kategorien');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ name: '', description: '' });
        await fetchCategories();
      } else {
        const errorData = await response.json();
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (error) {
      alert('Fehler beim Erstellen der Kategorie');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Kategorien verwalten" subtitle="Menü-Kategorien hinzufügen und bearbeiten">
        <div className="dashboard-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Kategorien...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Kategorien verwalten" subtitle="Menü-Kategorien hinzufügen und bearbeiten">
        <div className="dashboard-card p-8 text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kategorien verwalten" subtitle="Menü-Kategorien hinzufügen und bearbeiten">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold modern-title">Kategorien verwalten</h1>
            <p className="text-gray-600 modern-subtitle">Organisieren Sie Ihre Menü-Artikel in Kategorien</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="modern-button px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
          >
            ➕ Neue Kategorie
          </button>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="dashboard-card p-8 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Noch keine Kategorien vorhanden</h2>
            <p className="text-lg text-gray-600 mb-6">
              Erstellen Sie Ihre erste Kategorie, um Ihre Menü-Artikel zu organisieren.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="modern-button px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Erste Kategorie erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category.id} className="modern-card rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <span className="text-2xl">📂</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">Kategorie</p>
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Sortierung: {category.sortOrder}</span>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                      ✏️ Bearbeiten
                    </button>
                    <button className="px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium">
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Category Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="dashboard-card p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Neue Kategorie erstellen</h3>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategoriename *
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
                    Beschreibung
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
      </div>
    </AdminLayout>
  );
}
