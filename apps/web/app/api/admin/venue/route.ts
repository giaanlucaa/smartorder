import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { withTenantIsolation } from "@smartorder/auth/tenant";

export async function GET() {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const session = await requireAuth();
    
    return await withTenantIsolation(session, async (tenantContext) => {
      const venue = await prisma.venue.findUnique({
        where: { id: tenantContext.venueId },
        select: {
          id: true,
          name: true,
          themeColor: true,
          logoUrl: true,
          coverImageUrl: true,
          currency: true,
          address: true,
          vatRates: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!venue) {
        return NextResponse.json({ error: "Venue not found" }, { status: 404 });
      }

      return NextResponse.json(venue);
    });
  } catch (error) {
    console.error("Get venue error:", error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const session = await requireAuth();
    const { name, themeColor, logoUrl, coverImageUrl, address, currency } = await req.json();
    
    return await withTenantIsolation(session, async (tenantContext) => {
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (themeColor !== undefined) updateData.themeColor = themeColor;
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
      if (address !== undefined) updateData.address = address;
      if (currency !== undefined) updateData.currency = currency;

      const venue = await prisma.venue.update({
        where: { id: tenantContext.venueId },
        data: updateData,
        select: {
          id: true,
          name: true,
          themeColor: true,
          logoUrl: true,
          coverImageUrl: true,
          currency: true,
          address: true,
          vatRates: true,
          updatedAt: true,
        },
      });

      return NextResponse.json(venue);
    });
  } catch (error) {
    console.error("Update venue error:", error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
