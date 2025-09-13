import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaForTenant } from "@smartorder/db";
import { getTenantIdFromRequest, requireTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
    // Get tenant ID from request
    const tenantId = getTenantIdFromRequest(req);
    console.log('[orders-api] tenantId from request:', tenantId);
    console.log('[orders-api] x-venue-id header:', req.headers.get('x-venue-id'));
    
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant ID" }, { status: 400 });
  }
  
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

    // Use tenant-aware Prisma client
    const tenantDb = prismaForTenant(tenantId);
    
  const where: any = {};
  if (status) where.status = status;

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

  return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
  const { venueId, tableToken } = await req.json();
    if (!venueId || !tableToken) {
      return NextResponse.json({ error: "Missing venueId or tableToken" }, { status: 400 });
    }

    // Use tenant-aware Prisma client
    const tenantDb = prismaForTenant(venueId);

    const table = await tenantDb.table.findFirst({ 
      where: { qrToken: tableToken } 
    });
    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const order = await tenantDb.order.create({
    data: {
      tableId: table.id,
      status: "DRAFT",
      total: 0,
      taxTotal: 0,
      tipAmount: 0,
    },
  });

  return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
