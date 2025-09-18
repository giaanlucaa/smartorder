import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { withTenantIsolation } from "@smartorder/auth/tenant";

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
    console.error('Error fetching areas:', error);
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
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Area name is required" }, { status: 400 });
    }

    return await withTenantIsolation(session, async (tenantContext) => {
      const area = await prisma.area.create({
        data: {
          venueId: tenantContext.venueId,
          name: name.trim(),
        }
      });

      return NextResponse.json(area);
    });
  } catch (error) {
    console.error('Error creating area:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
