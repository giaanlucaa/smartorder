/**
 * Multi-Tenant Prisma Extension
 * Automatically enforces venueId filtering for tenant isolation
 */

import { Prisma } from '@prisma/client';
import { prisma } from './index';

// Models that have venueId and should be tenant-isolated
const TENANT_MODELS = new Set([
  'Order',
  'MenuItem',
  'MenuCategory',
  'Table',
  'Checkout',
  'UserVenueRole',
  'Area',
  'AuditLog'
]);

/**
 * Creates a tenant-aware Prisma client that automatically filters by venueId
 */
export function prismaForTenant(tenantId: string) {
  if (!tenantId) {
    throw new Error('Missing tenantId for tenant-aware Prisma client');
  }

  return prisma.$extends({
    query: {
      $allModels: {
        // READ operations - automatically add venueId filter
        async findMany({ model, operation, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { 
              AND: [
                { venueId: tenantId }, 
                args.where ?? {}
              ] 
            };
          }
          return query(args);
        },

        async findFirst({ model, operation, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { 
              AND: [
                { venueId: tenantId }, 
                args.where ?? {}
              ] 
            };
          }
          return query(args);
        },

        async findFirstOrThrow({ model, operation, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { 
              AND: [
                { venueId: tenantId }, 
                args.where ?? {}
              ] 
            };
          }
          return query(args);
        },

        async count({ model, operation, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { 
              AND: [
                { venueId: tenantId }, 
                args.where ?? {}
              ] 
            };
          }
          return query(args);
        },

        async aggregate({ model, operation, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { 
              AND: [
                { venueId: tenantId }, 
                args.where ?? {}
              ] 
            };
          }
          return query(args);
        },

        async groupBy({ model, operation, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { 
              AND: [
                { venueId: tenantId }, 
                args.where ?? {}
              ] 
            };
          }
          return query(args);
        },

        // WRITE operations - automatically set venueId
        async create({ model, operation, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.data = { 
              venueId: tenantId, 
              ...(args.data as object) 
            };
          }
          return query(args);
        },

        async createMany({ model, operation, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.data = (args.data as any[]).map(item => ({
              venueId: tenantId,
              ...item
            }));
          }
          return query(args);
        },

        // UPDATE operations - add venueId filter
        async updateMany({ model, operation, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { 
              AND: [
                { venueId: tenantId }, 
                args.where ?? {}
              ] 
            };
          }
          return query(args);
        },

        // DELETE operations - add venueId filter
        async deleteMany({ model, operation, args, query }) {
          if (TENANT_MODELS.has(model)) {
            args.where = { 
              AND: [
                { venueId: tenantId }, 
                args.where ?? {}
              ] 
            };
          }
          return query(args);
        },

        // IMPORTANT: findUnique, update, delete (single record operations)
        // cannot have additional where clauses. Use findFirst/updateMany/deleteMany instead
        // or ensure venueId is always included in the unique constraint
      },
    },
  });
}

/**
 * Helper to create a transaction with tenant context
 */
export async function withTenantTransaction<T>(
  tenantId: string, 
  callback: (tx: ReturnType<typeof prismaForTenant>) => Promise<T>
): Promise<T> {
  const tenantDb = prismaForTenant(tenantId);
  return await tenantDb.$transaction(async (tx) => {
    return await callback(tenantDb);
  });
}

/**
 * Helper to execute raw SQL with tenant context
 */
export async function withTenantRaw<T>(
  tenantId: string,
  sql: string,
  ...params: any[]
): Promise<T> {
  const tenantDb = prismaForTenant(tenantId);
  return await tenantDb.$queryRawUnsafe(sql, ...params);
}

