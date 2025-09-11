import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { withTenantIsolation } from "@smartorder/auth/tenant";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const session = await requireAuth();
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    return await withTenantIsolation(session, async (tenantContext) => {
      const category = await prisma.menuCategory.update({
        where: {
          id: params.id,
          venueId: tenantContext.venueId,
        },
        data: {
          name: name.trim(),
        }
      });

      return NextResponse.json(category);
    });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
      // Delete category and all its items
      await prisma.menuCategory.delete({
        where: {
          id: params.id,
          venueId: tenantContext.venueId,
        }
      });

      return NextResponse.json({ success: true });
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
