import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma, prismaForTenant } from "@smartorder/db";
import { Prisma } from "@prisma/client";
import { getTenantIdFromRequest } from "@/lib/tenant";

const Body = z.object({
  orderId: z.string().min(1),
  paymentMethod: z.string().optional(),
  tipAmount: z.number().min(0).optional(),      // CHF
  tipPercent: z.number().min(0).max(100).optional(),
}).partial();

export async function POST(req: Request) {
  try {
    // Set DATABASE_URL if not already set
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
    }
    
    const json = await req.json().catch(() => ({}));
    console.log('[payments/intent] Received request:', json);
    
    const parsed = Body.safeParse(json);
    console.log('[payments/intent] Parsed data:', parsed);
    
    if (!parsed.success) {
      console.error('[payments/intent] Validation error:', parsed.error);
      return NextResponse.json({ error: 'Invalid request data', details: parsed.error }, { status: 400 });
    }
    
    const orderId = parsed.data.orderId;
    if (!orderId) return NextResponse.json({ error: 'orderId missing' }, { status: 400 });

    // Get tenant ID from request
    const tenantId = getTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    // Use tenant-aware Prisma client
    const tenantDb = prismaForTenant(tenantId);
    
    const order = await tenantDb.order.findFirst({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    
    console.log('[payments/intent] Found order:', { id: order.id, status: order.status, total: order.total });

    const provider = process.env.PSP_PROVIDER;
    console.log('[payments/intent] PSP Provider:', provider);
    
    if (!provider || provider === 'test' || provider === 'none') {
      const pm = parsed.data.paymentMethod || 'test';
      console.log('[payments/intent] Payment method:', pm);

      const orderTotal = new Prisma.Decimal(order.total);
      const tip = typeof parsed.data.tipAmount === 'number'
        ? new Prisma.Decimal(parsed.data.tipAmount)
        : typeof parsed.data.tipPercent === 'number'
          ? orderTotal.mul(new Prisma.Decimal(parsed.data.tipPercent).div(100))
          : new Prisma.Decimal(0);

      const payAmount = orderTotal.add(tip);
      console.log('[payments/intent] Payment calculation:', { orderTotal: orderTotal.toString(), tip: tip.toString(), payAmount: payAmount.toString() });

      try {
        await tenantDb.$transaction(async (tx) => {
          // Bestellung als bezahlt + Tip speichern (Bestätigung jetzt!)
          await tx.order.update({
            where: { id: orderId },
            data: { status: 'PAID', tipAmount: tip },
          });

          // Payment erfassen
          await tx.payment.create({
        data: {
          orderId: order.id,
              provider: provider || 'test',
              providerRef: `${provider || 'test'}_${Date.now()}`,
              status: 'SETTLED',
              amount: payAmount,
              raw: { method: pm, tip: tip.toString() },
            },
          });

          // Checkout auf COMPLETED setzen (falls Checkout mit orderId existiert)
          await tx.checkout.updateMany({
            where: { orderId },
            data: { status: 'COMPLETED', tipAmount: tip, completedAt: new Date() },
          });
      });

      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?order=${orderId}`;
        console.log('[payments/intent] Payment successful, redirecting to:', redirectUrl);
      return NextResponse.json({ redirectUrl });
      } catch (dbError) {
        console.error('[payments/intent] Database error:', dbError);
        return NextResponse.json({ error: 'Database error', details: dbError instanceof Error ? dbError.message : 'Unknown database error' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'PSP not implemented' }, { status: 400 });
  } catch (err: any) {
    console.error('[payments/intent] error', err);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
