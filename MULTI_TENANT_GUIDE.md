# Multi-Tenant System Implementation

## Overview

Das SmartOrder System implementiert ein robustes Multi-Tenant System, das vollständige Datenisolation zwischen verschiedenen Venues (Restaurants) gewährleistet.

## Architektur

### 1. Tenant Identification

Das System identifiziert Tenants über verschiedene Methoden:

- **URL-Pattern**: `/t/{venueId}/...` (Gast-Flow)
- **Header**: `x-venue-id` (Admin/API)
- **Query Parameter**: `?venueId=...` (Fallback)

### 2. Tenant-Aware Prisma Extension

```typescript
import { prismaForTenant } from '@smartorder/db';

// Automatische venueId-Filterung
const tenantDb = prismaForTenant(venueId);
const orders = await tenantDb.order.findMany(); // Nur Orders dieser Venue
```

### 3. Automatische Sicherheit

- **Read Operations**: Automatische `venueId`-Filterung
- **Write Operations**: Automatische `venueId`-Zuweisung
- **Cross-Tenant Access**: Verhindert durch Prisma Extension

## Verwendung

### API Routes

```typescript
import { getTenantIdFromRequest } from '@/lib/tenant';
import { prismaForTenant } from '@smartorder/db';

export async function GET(req: Request) {
  const tenantId = getTenantIdFromRequest(req);
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
  }

  const tenantDb = prismaForTenant(tenantId);
  const orders = await tenantDb.order.findMany(); // Automatisch gefiltert
}
```

### Frontend Integration

```typescript
// Tenant aus URL extrahieren
import { getTenantIdFromPathname } from '@/lib/tenant';

const pathname = '/t/venue123/menu';
const tenantId = getTenantIdFromPathname(pathname); // 'venue123'
```

## Sicherheitsfeatures

### 1. Automatische Filterung

Alle Datenbankabfragen werden automatisch nach `venueId` gefiltert:

```typescript
// Diese Abfrage wird automatisch zu:
// WHERE venueId = 'tenant123' AND status = 'OPEN'
const orders = await tenantDb.order.findMany({
  where: { status: 'OPEN' }
});
```

### 2. Tenant-Isolation

- Keine Cross-Tenant Datenlecks möglich
- Automatische `venueId`-Zuweisung bei Creates
- Verhindert versehentliche Datenüberschreitungen

### 3. Validierung

```typescript
import { isValidTenantId } from '@/lib/tenant';

if (!isValidTenantId(tenantId)) {
  throw new Error('Invalid tenant ID format');
}
```

## Tenant-Modelle

Folgende Modelle sind tenant-isoliert:

- `Order` - Bestellungen
- `Payment` - Zahlungen  
- `MenuItem` - Menü-Items
- `MenuCategory` - Kategorien
- `Table` - Tische
- `Checkout` - Checkout-Sessions
- `UserVenueRole` - Benutzer-Rollen
- `Area` - Bereiche
- `AuditLog` - Audit-Logs

## Testing

```bash
# Tenant-Isolation testen
node apps/web/scripts/test-tenant-isolation.js
```

## Best Practices

### 1. Immer Tenant-Context verwenden

```typescript
// ❌ Falsch - direkter Prisma-Zugriff
const orders = await prisma.order.findMany();

// ✅ Richtig - tenant-aware
const tenantDb = prismaForTenant(tenantId);
const orders = await tenantDb.order.findMany();
```

### 2. Tenant-ID validieren

```typescript
const tenantId = getTenantIdFromRequest(req);
if (!tenantId || !isValidTenantId(tenantId)) {
  return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 });
}
```

### 3. Fehlerbehandlung

```typescript
try {
  const tenantDb = prismaForTenant(tenantId);
  const result = await tenantDb.order.findMany();
} catch (error) {
  console.error('Tenant operation failed:', error);
  return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
}
```

## Migration

Bestehende API-Routes müssen aktualisiert werden:

1. `getTenantIdFromRequest(req)` hinzufügen
2. `prismaForTenant(tenantId)` verwenden
3. Fehlerbehandlung für fehlende Tenant-IDs

## Monitoring

- Tenant-Isolation wird automatisch durch Prisma Extension überwacht
- Cross-Tenant Access-Versuche werden geloggt
- Fehlende Tenant-IDs werden als 400-Fehler zurückgegeben

## Sicherheitshinweise

- **Niemals** direkten Prisma-Zugriff ohne Tenant-Context
- **Immer** Tenant-ID validieren
- **Regelmäßig** Tenant-Isolation testen
- **Audit-Logs** für verdächtige Aktivitäten überwachen

