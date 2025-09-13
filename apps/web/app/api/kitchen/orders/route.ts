import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaForTenant } from "@smartorder/db";
import { getTenantIdFromRequest } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
    // Get tenant ID from request
    const tenantId = getTenantIdFromRequest(req);
    console.log('[kitchen-orders-api] tenantId from request:', tenantId);
    console.log('[kitchen-orders-api] x-venue-id header:', req.headers.get('x-venue-id'));
    
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant ID" }, { status: 400 });
    }
  
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Use tenant-aware Prisma client
    const tenantDb = prismaForTenant(tenantId);
    
    // Kitchen shows OPEN, CONFIRMED, and PAID orders
    const KITCHEN_STATUSES = ['OPEN', 'CONFIRMED', 'PAID'];
    const where: any = { status: { in: KITCHEN_STATUSES } };
    
    // If specific status requested, filter by it
    if (status && KITCHEN_STATUSES.includes(status)) {
      where.status = status;
    }

    const orders = await tenantDb.order.findMany({
      where,
      include: {
        table: {
          include: {
            area: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                description: true,
                allergens: true,
                price: true,
                taxRate: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            provider: true,
            status: true,
            amount: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`[kitchen-orders-api] Found ${orders.length} orders for tenant ${tenantId}`);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
