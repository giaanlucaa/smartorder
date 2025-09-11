import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🍽️ SmartOrder</h1>
          <p className="text-lg text-gray-600">Digitales Bestellsystem für Restaurants</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-8">
          <div className="space-y-4">
            <Link 
              href="/admin/auth/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              🔑 Anmelden
            </Link>
            <Link 
              href="/admin/auth/signup"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              📝 Restaurant registrieren
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
