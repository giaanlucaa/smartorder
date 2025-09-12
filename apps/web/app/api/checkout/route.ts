import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaForTenant } from "@smartorder/db";
import { getTenantIdFromRequest } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
    const { venueId, tableToken, cartData, sessionId } = await req.json();
    
    // Validate required parameters
    if (!venueId || !tableToken || !cartData) {
      return NextResponse.json({ 
        error: "Missing required parameters: venueId, tableToken, cartData" 
      }, { status: 400 });
    }

    // Use tenant-aware Prisma client
    const tenantDb = prismaForTenant(venueId);

    // Find the table
    const table = await tenantDb.table.findFirst({ 
      where: { qrToken: tableToken } 
    });
    
    if (!table) {
      return NextResponse.json({ 
        error: "Table not found" 
      }, { status: 404 });
    }

    // Calculate totals
    const totalAmount = cartData.reduce((sum: number, item: any) => 
      sum + (item.totalPrice || 0), 0
    );
    
    const taxAmount = totalAmount * 0.081; // 8.1% VAT
    const finalTotal = totalAmount + taxAmount;

    // Create checkout session
    const checkout = await tenantDb.checkout.create({
      data: {
        tableId: table.id,
        cartData,
        totalAmount: finalTotal,
        taxAmount,
        sessionId: sessionId || `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        status: 'PENDING',
        metadata: {
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          timestamp: new Date().toISOString()
        }
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        },
        table: {
          select: {
            id: true,
            label: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      checkout: {
        id: checkout.id,
        sessionId: checkout.sessionId,
        status: checkout.status,
        totalAmount: checkout.totalAmount,
        taxAmount: checkout.taxAmount,
        expiresAt: checkout.expiresAt,
        venue: checkout.venue,
        table: checkout.table
      }
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
    // Get tenant ID from request
    const tenantId = getTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const status = searchParams.get('status');

    // Use tenant-aware Prisma client
    const tenantDb = prismaForTenant(tenantId);

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (status) where.status = status;

    const checkouts = await tenantDb.checkout.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        },
        table: {
          select: {
            id: true,
            label: true
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ checkouts });

  } catch (error) {
    console.error('Checkout retrieval error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


