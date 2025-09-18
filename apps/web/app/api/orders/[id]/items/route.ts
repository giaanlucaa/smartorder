import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  const { itemId, qty, modifiers } = await req.json();
  const orderId = params.id;

  const [order, item] = await Promise.all([
    prisma.order.findUnique({ where: { id: orderId } }),
    prisma.menuItem.findUnique({ where: { id: itemId } }),
  ]);

  if (!order || !item) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.create({
      data: {
        orderId,
        itemId,
        qty: qty ?? 1,
        unitPrice: item.price,
        modifiers: modifiers || {},
      },
    });

    const items = await tx.orderItem.findMany({ where: { orderId } });
    const subtotal = items.reduce((s, it) => s + Number(it.unitPrice) * it.qty, 0);
    const taxTotal = 0;

    await tx.order.update({ where: { id: orderId }, data: { total: subtotal, taxTotal, status: "OPEN" } });
  });

  return NextResponse.json({ ok: true });
}
