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
      const categories = await prisma.menuCategory.findMany({
        where: { venueId: tenantContext.venueId },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          name: true,
          position: true,
          _count: {
            select: { items: true }
          }
        }
      });

      return NextResponse.json({ categories });
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
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
    const { name, position } = await req.json();

    return await withTenantIsolation(session, async (tenantContext) => {
      const category = await prisma.menuCategory.create({
        data: {
          venueId: tenantContext.venueId,
          name,
          position: position || 99
        }
      });

      return NextResponse.json(category);
    });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
