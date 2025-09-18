# Vercel Deployment Guide für SmartOrder

## 🚀 Vorbereitung für Vercel

### 1. Datenbank einrichten
Sie benötigen eine PostgreSQL-Datenbank. Empfohlene Optionen:
- **Vercel Postgres** (einfachste Option)
- **Supabase** (kostenloser Plan verfügbar)
- **Neon** (kostenloser Plan verfügbar)
- **Railway** (kostenloser Plan verfügbar)

### 2. Umgebungsvariablen in Vercel setzen
Gehen Sie zu Ihrem Vercel-Projekt → Settings → Environment Variables:

#### Erforderliche Variablen:
```
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your_super_secret_session_key_here_minimum_32_characters
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Optionale Variablen (für Zahlungen):
```
PSP_PROVIDER=payrexx
PAYREXX_API_KEY=your_api_key
PAYREXX_INSTANCE=your_instance
```

### 3. Deployment-Schritte

1. **Repository zu Vercel verbinden:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Deploy
   vercel
   ```

2. **Oder über Vercel Dashboard:**
   - GitHub Repository verbinden
   - Build Command: `pnpm build`
   - Output Directory: `apps/web`
   - Install Command: `pnpm install`

### 4. Datenbank-Migrationen
Nach dem ersten Deployment:
```bash
# In Vercel Functions oder lokal
npx prisma migrate deploy
npx prisma db seed
```

### 5. Build-Konfiguration
Das Projekt ist bereits konfiguriert mit:
- ✅ `vercel.json` - Vercel-spezifische Einstellungen
- ✅ `.vercelignore` - Dateien die ignoriert werden sollen
- ✅ Next.js 14.2.5 - Vercel-kompatibel
- ✅ Monorepo-Setup - Funktioniert mit Vercel

## 🔧 Troubleshooting

### Build-Fehler:
- Stellen Sie sicher, dass alle Umgebungsvariablen gesetzt sind
- Prüfen Sie die Datenbankverbindung
- Überprüfen Sie die Build-Logs in Vercel

### Datenbank-Probleme:
- Verwenden Sie eine Vercel-kompatible PostgreSQL-Datenbank
- Stellen Sie sicher, dass `DATABASE_URL` korrekt formatiert ist
- Führen Sie Migrationen nach dem Deployment aus

### Performance:
- Das Projekt ist für Vercel optimiert
- Serverless Functions haben 30s Timeout
- Statische Assets werden automatisch optimiert

## 📝 Nächste Schritte

1. **Datenbank einrichten** (Vercel Postgres empfohlen)
2. **Umgebungsvariablen setzen** in Vercel Dashboard
3. **Repository zu Vercel verbinden**
4. **Erstes Deployment** durchführen
5. **Datenbank-Migrationen** ausführen
6. **Testen** der Anwendung

## 🎯 Empfohlene Datenbank-Anbieter

### Vercel Postgres (Empfohlen)
- Direkte Integration mit Vercel
- Automatische Backups
- Einfache Skalierung

### Supabase
- Kostenloser Plan: 500MB
- PostgreSQL + Auth + Storage
- Gute Dokumentation

### Neon
- Kostenloser Plan: 3GB
- Serverless PostgreSQL
- Branching für Datenbanken

Das Projekt ist jetzt bereit für Vercel! 🚀
