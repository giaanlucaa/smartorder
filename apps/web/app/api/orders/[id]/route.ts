import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  const { status } = await req.json();
  const orderId = params.id;

  if (!status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  const validStatuses = ['OPEN', 'PAID', 'FULFILLED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        table: {
          include: {
            area: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                description: true,
                allergens: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: {
          include: {
            area: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                description: true,
                allergens: true
              }
            }
          }
        },
        payments: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
