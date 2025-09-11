import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if any payment provider is configured
    const hasPaymentProvider = process.env.PSP_PROVIDER || 
                              process.env.DATATRANS_MERCHANT_ID || 
                              process.env.PAYREXX_API_KEY;

    return NextResponse.json({ 
      enabled: !!hasPaymentProvider,
      provider: process.env.PSP_PROVIDER || null
    });
  } catch (error) {
    console.error("Payment check error:", error);
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}
