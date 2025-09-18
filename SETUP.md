# SmartOrder Setup Guide

## 🚀 Schnellstart

### 1. Dependencies installieren
```bash
pnpm install
```

### 2. Datenbank starten
```bash
# Docker Compose starten (PostgreSQL + Redis)
docker-compose -f ops/docker-compose.yml up -d
```

### 3. Datenbank migrieren
```bash
# Prisma Schema zur Datenbank pushen
pnpm db:push

# Demo-Daten laden
pnpm seed
```

### 4. Entwicklungsserver starten
```bash
pnpm dev
```

Die App ist jetzt verfügbar unter: http://localhost:3000

## 📱 Features testen

### Gast-Interface
- **Tisch 1**: http://localhost:3000/t/demo/t1token
- **Tisch 4**: http://localhost:3000/t/demo/t4token

### Kitchen Display System
- **KDS**: http://localhost:3000/kitchen

### Admin-Portal
- **Admin**: http://localhost:3000/admin
- **Tischverwaltung**: http://localhost:3000/admin/tables

## 🗂️ Demo-Daten

Das Seed-Script erstellt:
- **Restaurant**: Demo Bistro
- **Bereiche**: Saal, Terrasse
- **Tische**: T1-T3 (Saal), T4-T5 (Terrasse)
- **Kategorien**: Burgers, Pizza, Getränke
- **Artikel**: 8 verschiedene Menü-Items

## 🔧 Entwicklung

### Nützliche Commands
```bash
# Datenbank Studio öffnen
pnpm db:studio

# Neue Migration erstellen
pnpm db:migrate

# Build für Production
pnpm build

# Production starten
pnpm start
```

### Umgebungsvariablen
Erstelle eine `.env` Datei im Root-Verzeichnis:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartorder"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🐛 Troubleshooting

### Datenbank-Verbindung
```bash
# Prüfe ob PostgreSQL läuft
docker ps

# Logs anzeigen
docker-compose -f ops/docker-compose.yml logs
```

### Dependencies
```bash
# Node modules neu installieren
rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf packages/*/node_modules
pnpm install
```

### Prisma Probleme
```bash
# Prisma Client neu generieren
pnpm --filter db prisma generate

# Datenbank zurücksetzen
pnpm --filter db prisma db push --force-reset
pnpm seed
```

## 📋 Nächste Schritte

1. **Payment Integration**: Payrexx PSP einrichten
2. **Real-time Updates**: Pusher/WebSocket für KDS
3. **QR-Code PDF**: Echte PDF-Generierung
4. **Authentication**: Admin-Login implementieren
5. **Image Upload**: Menü-Bilder verwalten

## 🆘 Support

Bei Problemen:
1. Prüfe die Logs: `docker-compose logs`
2. Prüfe die Datenbank: `pnpm db:studio`
3. Teste die API: http://localhost:3000/api/menu?venue=demo
