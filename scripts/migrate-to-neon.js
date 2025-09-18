#!/usr/bin/env node

/**
 * Migration Script: Lokale Datenbank zu Neon
 * 
 * Dieses Skript hilft bei der Migration von der lokalen PostgreSQL-Datenbank zu Neon
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 SmartOrder → Neon Migration Script');
console.log('=====================================\n');

// Überprüfe ob .env.local existiert
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local nicht gefunden!');
  console.log('📝 Bitte erstellen Sie .env.local mit Ihrer Neon-DATABASE_URL');
  console.log('💡 Kopieren Sie env.neon.example zu .env.local');
  process.exit(1);
}

// Lade Umgebungsvariablen
require('dotenv').config({ path: envPath });

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL nicht in .env.local gefunden!');
  console.log('📝 Bitte fügen Sie Ihre Neon-DATABASE_URL hinzu');
  process.exit(1);
}

if (!process.env.DATABASE_URL.includes('neon.tech')) {
  console.log('⚠️  Warnung: DATABASE_URL scheint nicht von Neon zu sein');
  console.log('🔗 Erwartetes Format: postgresql://...@ep-xxx-xxx.eu-central-1.aws.neon.tech/...');
}

console.log('✅ .env.local gefunden');
console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));

try {
  console.log('\n📦 Wechsle zu packages/db...');
  process.chdir(path.join(__dirname, '..', 'packages', 'db'));

  console.log('\n🔄 Führe Prisma Migrationen aus...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  console.log('\n⚡ Generiere Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('\n🌱 Seede Datenbank (optional)...');
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Seeding fehlgeschlagen (optional)');
  }

  console.log('\n🎉 Migration erfolgreich abgeschlossen!');
  console.log('\n📋 Nächste Schritte:');
  console.log('1. Testen Sie die Verbindung: pnpm dev');
  console.log('2. Überprüfen Sie das Neon-Dashboard');
  console.log('3. Konfigurieren Sie Vercel mit der DATABASE_URL');

} catch (error) {
  console.log('\n❌ Migration fehlgeschlagen!');
  console.log('🔍 Fehler:', error.message);
  console.log('\n📞 Hilfe:');
  console.log('- Überprüfen Sie Ihre DATABASE_URL');
  console.log('- Stellen Sie sicher, dass Neon-Datenbank erreichbar ist');
  console.log('- Überprüfen Sie die Prisma-Migrationen');
  process.exit(1);
}
