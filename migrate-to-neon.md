# Migration zu Neon - Schritt-für-Schritt Anleitung

## 🎯 Ziel
Migration Ihrer lokalen PostgreSQL-Datenbank zu Neon Cloud-Datenbank

## 📋 Voraussetzungen
- ✅ Neon-Konto erstellt
- ✅ Neon-Projekt erstellt
- ✅ Datenbank-URL erhalten

## 🚀 Schritt-für-Schritt Migration

### 1. Neon-Datenbank-URL konfigurieren

1. **Kopieren Sie Ihre Neon-Datenbank-URL** aus dem Neon-Dashboard
2. **Erstellen Sie eine `.env.local` Datei** im Projekt-Root:
   ```bash
   # Kopieren Sie env.neon.example zu .env.local
   cp env.neon.example .env.local
   ```
3. **Ersetzen Sie die DATABASE_URL** in `.env.local` mit Ihrer echten Neon-URL

### 2. Schema zu Neon migrieren

```bash
# 1. Wechseln Sie ins db-Package
cd packages/db

# 2. Führen Sie die Migrationen aus
npx prisma migrate deploy

# 3. Generieren Sie den Prisma Client
npx prisma generate

# 4. Seeden Sie die Datenbank (optional)
npx prisma db seed
```

### 3. Verbindung testen

```bash
# Zurück ins Root-Verzeichnis
cd ../..

# Starten Sie den Entwicklungsserver
pnpm dev
```

### 4. Für Vercel konfigurieren

1. **Gehen Sie zu Ihrem Vercel-Projekt**
2. **Settings → Environment Variables**
3. **Fügen Sie hinzu**:
   ```
   DATABASE_URL=postgresql://username:password@ep-xxx-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   SESSION_SECRET=your_super_secret_session_key_here
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

## 🔧 Troubleshooting

### Problem: "Connection refused"
- ✅ Überprüfen Sie die DATABASE_URL
- ✅ Stellen Sie sicher, dass `sslmode=require` enthalten ist
- ✅ Überprüfen Sie die Neon-Dashboard-Verbindung

### Problem: "Schema not found"
- ✅ Führen Sie `npx prisma migrate deploy` aus
- ✅ Überprüfen Sie die Migrationen in `prisma/migrations/`

### Problem: "Authentication failed"
- ✅ Überprüfen Sie Username/Password in der URL
- ✅ Generieren Sie ein neues Passwort im Neon-Dashboard

## 📊 Neon-Dashboard Features

- **SQL Editor**: Direkte SQL-Abfragen
- **Connection Details**: Verbindungsinformationen
- **Metrics**: Datenbank-Performance
- **Backups**: Automatische Backups
- **Branches**: Datenbank-Branches für Entwicklung

## 🎉 Nach der Migration

- ✅ Lokale Entwicklung mit Neon
- ✅ Vercel-Deployment mit Neon
- ✅ Automatische Backups
- ✅ Skalierbare Performance
- ✅ Kostenloser Plan: 3GB Speicher

## 📞 Support

- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Vercel Docs**: https://vercel.com/docs
