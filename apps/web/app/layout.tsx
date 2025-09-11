import './globals.css';
import Navigation from './components/Navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="thai-gradient-subtle min-h-screen">
        <div className="thai-pattern absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
