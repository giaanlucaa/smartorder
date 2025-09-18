import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { withTenantIsolation } from "@smartorder/auth/tenant";

export async function GET(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
    const session = await requireAuth();
    
    return await withTenantIsolation(session, async (tenantContext) => {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');

      // Only show orders from the authenticated user's venue
      const where: any = {
        venueId: tenantContext.venueId
      };
      if (status) where.status = status;

      const orders = await prisma.order.findMany({
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
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  const { venueId, tableToken, tipAmount = 0 } = await req.json();
  if (!venueId || !tableToken) return NextResponse.json({ error: "missing" }, { status: 400 });

  const table = await prisma.table.findFirst({ where: { venueId, qrToken: tableToken } });
  if (!table) return NextResponse.json({ error: "table not found" }, { status: 404 });

  const order = await prisma.order.create({
    data: {
      venueId,
      tableId: table.id,
      status: "DRAFT",
      total: 0,
      taxTotal: 0,
      tipAmount: parseFloat(tipAmount.toString()) || 0,
    },
  });

  return NextResponse.json(order);
}
