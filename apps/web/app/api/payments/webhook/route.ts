import { NextRequest } from "next/server";
import { prisma } from "@smartorder/db";
// import { getProvider } from "../../../../../../packages/psp/src/index";

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

  // Temporarily disabled - PSP package not implemented yet
  // const provider = getProvider();
  // const { ok, providerEventId, orderId, amount, status, raw } = provider.verifyWebhook(rawBody, headers);
  // if (!ok) return new Response("invalid signature", { status: 400 });

  // Mock webhook verification for now
  const providerEventId = "mock_" + Date.now();
  const orderId = "mock_order_id";
  const amount = 0;
  const status = "SETTLED";
  const raw = {};

  try {
    await prisma.$transaction(async (tx) => {
      if (providerEventId) {
        const exists = await tx.payment.findFirst({ where: { providerEventId } });
        if (exists) return;
      }

      const order = await tx.order.findUnique({ where: { id: orderId! } });
      if (!order) throw new Error("order not found");

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: process.env.PSP_PROVIDER || "payrexx",
          providerEventId: providerEventId || undefined,
          status: status === "SETTLED" ? "SETTLED" : status === "CANCELED" ? "CANCELED" : "FAILED",
          amount: amount ?? order.total,
          raw,
        },
      });

      if (status === "SETTLED") {
        const venue = await tx.venue.update({
          where: { id: order.venueId },
          data: { invoiceSeq: { increment: 1 } },
        });
        const invoiceNo = `${new Date().getFullYear()}-${venue.invoiceSeq.toString().padStart(6, "0")}`;

        await tx.order.update({ where: { id: order.id }, data: { status: "PAID", invoiceNo } });
      }
    });
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }

  return new Response("ok");
}
