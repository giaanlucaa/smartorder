import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";

export async function GET(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  const { searchParams } = new URL(req.url);
  const venueId = searchParams.get('venueId');
  const status = searchParams.get('status');

  // For kitchen display, we need to show orders from all venues
  // In a real app, you might want to add authentication here
  const where: any = {};
  if (venueId) where.venueId = venueId;
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
}

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  const { venueId, tableToken } = await req.json();
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
      tipAmount: 0,
    },
  });

  return NextResponse.json(order);
}
