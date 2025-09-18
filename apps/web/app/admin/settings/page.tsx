'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';

interface Venue {
  id: string;
  name: string;
  themeColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  currency: string;
  address?: string;
}

export default function VenueSettingsPage() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchVenue();
  }, []);

  const fetchVenue = async () => {
    try {
      const response = await fetch('/api/admin/venue');
      if (response.ok) {
        const data = await response.json();
        setVenue(data);
      } else if (response.status === 401) {
        router.push('/admin/auth/login');
      }
    } catch (error) {
      setError('Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/venue', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(venue),
      });

      if (response.ok) {
        setSuccess('Einstellungen gespeichert!');
      } else {
        setError('Fehler beim Speichern');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'cover') => {
    try {
      // Get presigned URL
      const presignResponse = await fetch('/api/admin/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error('Upload-Vorbereitung fehlgeschlagen');
      }

      const { key, url } = await presignResponse.json();

      // Upload to S3
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload fehlgeschlagen');
      }

      // Update venue with new URL
      const publicUrl = `https://smartorder-uploads.s3.amazonaws.com/${key}`;
      const updatedVenue = {
        ...venue,
        [type === 'logo' ? 'logoUrl' : 'coverImageUrl']: publicUrl,
      };
      setVenue(updatedVenue);

      setSuccess(`${type === 'logo' ? 'Logo' : 'Hintergrundbild'} hochgeladen!`);
    } catch (error) {
      setError('Upload fehlgeschlagen');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Neues Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setChangingPassword(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setSuccess('Passwort erfolgreich geändert!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordChange(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Ändern des Passworts');
      }
    } catch (error) {
      setError('Netzwerkfehler');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen modern-gradient-subtle flex items-center justify-center">
        <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lade Einstellungen...</h2>
          <p className="text-gray-600">Bitte warten Sie einen Moment</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <AdminLayout title="Einstellungen" subtitle="Fehler beim Laden der Einstellungen">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Fehler beim Laden der Einstellungen</h2>
            <p className="text-gray-600">Bitte versuchen Sie es später erneut</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Restaurant-Einstellungen" subtitle="Verwalten Sie Ihre Restaurant-Einstellungen">
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="modern-card rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="modern-button px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Passwort ändern
                </button>
              </div>

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

            <form onSubmit={handleSave} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Restaurant-Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={venue.name}
                    onChange={(e) => setVenue({ ...venue, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                    Währung
                  </label>
                  <select
                    id="currency"
                    value={venue.currency}
                    onChange={(e) => setVenue({ ...venue, currency: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="CHF">CHF</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Adresse
                </label>
                <textarea
                  id="address"
                  rows={3}
                  value={venue.address || ''}
                  onChange={(e) => setVenue({ ...venue, address: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Theme */}
              <div>
                <label htmlFor="themeColor" className="block text-sm font-medium text-gray-700">
                  Markenfarbe
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    type="color"
                    id="themeColor"
                    value={venue.themeColor || '#3B82F6'}
                    onChange={(e) => setVenue({ ...venue, themeColor: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={venue.themeColor || '#3B82F6'}
                    onChange={(e) => setVenue({ ...venue, themeColor: e.target.value })}
                    className="block w-32 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Logo
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {venue.logoUrl && (
                    <img src={venue.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hintergrundbild
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {venue.coverImageUrl && (
                    <img src={venue.coverImageUrl} alt="Cover" className="h-16 w-24 object-cover rounded" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'cover');
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="ml-3 inline-flex justify-center py-2 px-4 modern-button text-sm font-medium rounded-md disabled:opacity-50"
                >
                  {saving ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modern-card rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Passwort ändern</h3>
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Aktuelles Passwort
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Neues Passwort
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Neues Passwort bestätigen
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    className="px-4 py-2 modern-button-secondary rounded-md"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-4 py-2 modern-button rounded-md disabled:opacity-50"
                  >
                    {changingPassword ? 'Wird geändert...' : 'Passwort ändern'}
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
