import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { withTenantIsolation } from "@smartorder/auth/tenant";

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }
  
  try {
    const session = await requireAuth();
    
    return await withTenantIsolation(session, async (tenantContext) => {
      const areas = await prisma.area.findMany({
        where: { venueId: tenantContext.venueId },
        include: {
          tables: {
            include: {
              area: true
            },
            orderBy: {
              label: 'asc'
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return NextResponse.json({ areas });
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const session = await requireAuth();
    const { areaId, label } = await req.json();

    if (!areaId || !label) {
      return NextResponse.json({ error: "Area ID and label are required" }, { status: 400 });
    }

    return await withTenantIsolation(session, async (tenantContext) => {
      // Verify the area belongs to this venue
      const area = await prisma.area.findFirst({
        where: { 
          id: areaId, 
          venueId: tenantContext.venueId 
        }
      });

      if (!area) {
        return NextResponse.json({ error: "Area not found" }, { status: 404 });
      }

      // Generate a unique QR token
      const qrToken = `t${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      const table = await prisma.table.create({
        data: {
          areaId,
          venueId: tenantContext.venueId,
          label: label.trim(),
          qrToken,
        },
        include: {
          area: true
        }
      });

      return NextResponse.json(table);
    });
  } catch (error) {
    console.error('Error creating table:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}