import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen modern-gradient-subtle">
      <div className="modern-pattern absolute inset-0 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <h1 className="text-6xl font-bold modern-title mb-4">
              SmartOrder
            </h1>
            <p className="text-2xl text-gray-600 mb-2">Digitales Bestellsystem für Restaurants</p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Modernisieren Sie Ihr Restaurant mit unserem intelligenten QR-Code Bestellsystem. 
              Einfach, schnell und benutzerfreundlich.
            </p>
          </div>
          
          {/* Main Action Card */}
          <div className="dashboard-card p-8 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Willkommen bei SmartOrder</h2>
              <p className="text-lg text-gray-600">
                Wählen Sie eine Option, um fortzufahren
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Link 
                href="/admin/auth/login"
                className="group modern-button p-6 rounded-2xl text-center block transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-4">🔑</div>
                <h3 className="text-xl font-bold mb-2">Anmelden</h3>
                <p className="text-blue-100">Zugang zu Ihrem Restaurant-Dashboard</p>
              </Link>
              
              <Link 
                href="/admin/auth/signup"
                className="group modern-button-secondary p-6 rounded-2xl text-center block transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-xl font-bold mb-2">Restaurant registrieren</h3>
                <p className="text-gray-300">Neues Restaurant anmelden</p>
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="dashboard-card p-6 text-center">
              <div className="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">QR-Code Bestellung</h3>
              <p className="text-gray-600">Gäste bestellen einfach über QR-Code am Tisch</p>
            </div>

            <div className="dashboard-card p-6 text-center">
              <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Echtzeit Dashboard</h3>
              <p className="text-gray-600">Verwalten Sie Bestellungen in Echtzeit</p>
            </div>

            <div className="dashboard-card p-6 text-center">
              <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Schnell & Effizient</h3>
              <p className="text-gray-600">Reduzieren Sie Wartezeiten und steigern Sie den Umsatz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
