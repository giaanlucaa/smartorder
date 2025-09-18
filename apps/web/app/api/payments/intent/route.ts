import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
// import { getProvider } from "../../../../../packages/psp/src/index";

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  const { orderId, paymentMethod } = await req.json();
  const order = await prisma.order.findUnique({ 
    where: { id: orderId }, 
    include: { 
      venue: true,
      table: true
    } 
  });
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle different payment methods
  if (paymentMethod === 'direct' || paymentMethod === 'cash') {
    // Direkte Bestellung oder Barzahlung - direkt als bezahlt markieren
    const provider = paymentMethod === 'direct' ? 'direct' : 'cash';
    
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: provider,
        providerRef: `${provider}_${Date.now()}`,
        status: "SETTLED",
        amount: order.total,
      },
    });

    // Bestellung als offen markieren (für Kitchen Dashboard)
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "OPEN" },
    });

    return NextResponse.json({
      providerRef: `${provider}_${Date.now()}`,
      redirectUrl: `${baseUrl}/success?orderId=${order.id}&payment=${provider}&venueId=${order.venueId}&tableToken=${order.table.qrToken}`
    });
  }

  // Check if payment provider is configured for online payments
  const hasPaymentProvider = process.env.PSP_PROVIDER || 
                            process.env.DATATRANS_MERCHANT_ID || 
                            process.env.PAYREXX_API_KEY;

  if (!hasPaymentProvider) {
    // No payment provider - simulate successful payment for testing
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: paymentMethod || "test",
        providerRef: "test_" + Date.now(),
        status: "SETTLED",
        amount: order.total,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "OPEN" },
    });

    return NextResponse.json({
      providerRef: "test_" + Date.now(),
      redirectUrl: `${baseUrl}/success?orderId=${order.id}&payment=${paymentMethod || 'test'}&venueId=${order.venueId}&tableToken=${order.table.qrToken}`
    });
  }

  // Real payment processing (when provider is configured)
  // Temporarily disabled - PSP package not implemented yet
  // const provider = getProvider();
  // const intent = await provider.createCheckout({
  //   orderId: order.id,
  //   amount: Number(order.total),
  //   currency: order.venue.currency,
  //   description: `Order ${order.id}`,
  //   successUrl: `${baseUrl}/success`,
  //   failureUrl: `${baseUrl}/checkout?failed=1`,
  // });

  // Mock response for now
  const intent = {
    providerRef: "mock_" + Date.now(),
    redirectUrl: `${baseUrl}/success?mock=1`
  };

  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: paymentMethod || process.env.PSP_PROVIDER || "payrexx",
      providerRef: intent.providerRef,
      status: "PENDING",
      amount: order.total,
    },
  });

  return NextResponse.json(intent);
}
