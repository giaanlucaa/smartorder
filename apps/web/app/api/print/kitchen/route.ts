import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { formatKitchen } from "@smartorder/printer/format";

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  const { orderId, printerIp } = await req.json();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { item: true } }, venue: true },
  });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  const html = formatKitchen(order as any);
  
  // For server-side printing, we return the formatted HTML
  // The client can then handle the actual printing
  return NextResponse.json({ 
    ok: true, 
    html,
    printerIp 
  });
}
