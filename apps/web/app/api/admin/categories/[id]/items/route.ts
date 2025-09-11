import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { withTenantIsolation } from "@smartorder/auth/tenant";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const session = await requireAuth();

    return await withTenantIsolation(session, async (tenantContext) => {
      // Verify the category belongs to this venue
      const category = await prisma.menuCategory.findFirst({
        where: {
          id: params.id,
          venueId: tenantContext.venueId,
        }
      });

      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }

      const items = await prisma.menuItem.findMany({
        where: {
          categoryId: params.id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          isActive: true,
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Convert price to number for consistent formatting
      const itemsWithNumericPrice = items.map(item => ({
        ...item,
        price: Number(item.price)
      }));

      return NextResponse.json({ items: itemsWithNumericPrice });
    });
  } catch (error) {
    console.error('Error fetching category items:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
