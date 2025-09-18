# SmartOrder - Digitales Bestellsystem für Restaurants

SmartOrder ist ein Multi-Tenant Bestellsystem für Restaurants. Gäste scannen QR-Codes am Tisch, bestellen direkt über ihr Smartphone und bezahlen digital. Das System überträgt Bestellungen automatisch an die Küche und verwaltet alles zentral.

## 🚀 Features

- **Multi-Tenant**: Jedes Restaurant kann sich registrieren und sein eigenes Menü verwalten
- **QR-Code Bestellung**: Gäste scannen QR-Code und bestellen direkt am Tisch
- **Kitchen Display**: Live-Übertragung aller Bestellungen an die Küche
- **Digital Payment**: Sichere Bezahlung (optional, läuft auch ohne Payment-Provider)
- **Admin-Portal**: Vollständige Verwaltung von Menü, Tischen und Einstellungen
- **Branding**: Anpassbare Farben, Logo und Hintergrundbilder

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Session-based mit Argon2
- **Payments**: DataTrans / Payrexx (optional)
- **File Upload**: AWS S3 (optional)

## 📋 Voraussetzungen

- Node.js 18+
- PostgreSQL 14+
- pnpm (Package Manager)

## 🚀 Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd smartorder
   ```

2. **Dependencies installieren**
   ```bash
   pnpm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp env.example .env
   ```
   
   Bearbeiten Sie die `.env` Datei und setzen Sie:
   - `DATABASE_URL`: PostgreSQL Verbindungsstring
   - `NEXT_PUBLIC_APP_URL`: URL der Anwendung
   - Optional: Payment Provider Keys (siehe unten)

4. **Datenbank einrichten**
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

5. **Anwendung starten**
   ```bash
   pnpm dev
   ```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

## 💳 Payment Configuration (Optional)

Das System läuft standardmäßig im **No-Payment-Modus**. Gäste können bestellen, werden aber direkt zur Success-Seite weitergeleitet.

Um Payment zu aktivieren, setzen Sie eine der folgenden Konfigurationen:

### DataTrans
```env
PSP_PROVIDER="datatrans"
DATATRANS_MERCHANT_ID="your_merchant_id"
DATATRANS_API_PASSWORD="your_api_password"
DATATRANS_USE_SANDBOX="true"
```

### Payrexx
```env
PSP_PROVIDER="payrexx"
PAYREXX_API_KEY="your_api_key"
PAYREXX_INSTANCE="your_instance"
```

## 🏪 Erste Schritte

1. **Restaurant registrieren**
   - Gehen Sie zu `/admin/auth/signup`
   - Erstellen Sie ein neues Restaurant

2. **Menü aufbauen**
   - Erstellen Sie Kategorien (z.B. "Vorspeisen", "Hauptgerichte")
   - Fügen Sie Artikel zu den Kategorien hinzu

3. **Tische anlegen**
   - Erstellen Sie Bereiche (z.B. "Hauptraum", "Terrasse")
   - Fügen Sie Tische zu den Bereichen hinzu
   - Generieren Sie QR-Codes für jeden Tisch

4. **Gästeansicht testen**
   - Scannen Sie einen QR-Code oder besuchen Sie `/t/{venueId}/{tableToken}`
   - Testen Sie den Bestellvorgang

## 📱 Verwendung

### Für Restaurant-Betreiber

1. **Admin-Portal**: `/admin`
   - Menüverwaltung
   - Tischverwaltung
   - Einstellungen & Branding
   - Bestellungen einsehen

2. **Kitchen Display**: `/kitchen`
   - Live-Ansicht aller Bestellungen
   - Status-Updates (Offen → Bezahlt → Fertig)

### Für Gäste

1. **QR-Code scannen** am Tisch
2. **Menü durchsuchen** und Artikel auswählen
3. **Warenkorb prüfen** und zur Kasse gehen
4. **Bezahlen** (falls Payment aktiviert)
5. **Bestellung wird an Küche übertragen**

## 🔧 Entwicklung

### Scripts

```bash
# Entwicklungsserver starten
pnpm dev

# Datenbank Schema pushen
pnpm db:push

# Datenbank zurücksetzen und seeden
pnpm db:reset

# Build für Produktion
pnpm build

# Produktionsserver starten
pnpm start
```

### Projektstruktur

```
smartorder/
├── apps/web/                 # Next.js Anwendung
│   ├── app/                  # App Router
│   │   ├── admin/           # Admin-Portal
│   │   ├── api/             # API Routes
│   │   ├── t/               # Gäste-Interface
│   │   └── ...
│   └── ...
├── packages/                 # Shared Packages
│   ├── auth/                # Authentication
│   ├── db/                  # Database & Prisma
│   ├── psp/                 # Payment Service Provider
│   └── ...
└── ...
```

## 🚀 Deployment

### Vercel (Empfohlen)

1. **Repository zu Vercel verbinden**
2. **Umgebungsvariablen setzen** in Vercel Dashboard
3. **PostgreSQL Database** (z.B. Vercel Postgres, Supabase, PlanetScale)
4. **Deploy**

### Docker

```bash
# Docker Compose starten
docker-compose up -d

# Datenbank migrieren
docker-compose exec web pnpm db:push
```

## 🔒 Sicherheit

- **Session-basierte Authentifizierung** mit sicheren Cookies
- **Argon2** für Passwort-Hashing
- **Tenant-Isolation** - Jedes Restaurant sieht nur seine eigenen Daten
- **CSRF-Schutz** durch Next.js
- **Input-Validierung** auf allen API-Endpunkten

## 📄 Lizenz

Dieses Projekt ist für Demonstrationszwecke erstellt. Für kommerzielle Nutzung kontaktieren Sie den Autor.

## 🤝 Support

Bei Fragen oder Problemen erstellen Sie ein Issue im Repository oder kontaktieren Sie den Entwickler.

---

**SmartOrder** - Digitales Bestellsystem für Restaurants 🍽️