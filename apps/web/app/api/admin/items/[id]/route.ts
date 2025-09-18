import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { withTenantIsolation } from "@smartorder/auth/tenant";

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
      // First, verify the item belongs to a category in this venue
      const item = await prisma.menuItem.findFirst({
        where: {
          id: params.id,
          category: {
            venueId: tenantContext.venueId,
          },
        },
        include: {
          category: true,
        },
      });

      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      // Delete the item
      await prisma.menuItem.delete({
        where: {
          id: params.id,
        },
      });

      return NextResponse.json({ success: true });
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { name, description, price, categoryName, taxRate, allergens, imageUrl, isActive } = await req.json();

    if (!name || !price || !categoryName) {
      return NextResponse.json({ error: "Name, price, and category are required" }, { status: 400 });
    }

    return await withTenantIsolation(session, async (tenantContext) => {
      // First, verify the item belongs to a category in this venue
      const existingItem = await prisma.menuItem.findFirst({
        where: {
          id: params.id,
          category: {
            venueId: tenantContext.venueId,
          },
        },
        include: {
          category: true,
        },
      });

      if (!existingItem) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      // Find or create the category
      let category = await prisma.menuCategory.findFirst({
        where: {
          name: categoryName,
          venueId: tenantContext.venueId,
        },
      });

      if (!category) {
        category = await prisma.menuCategory.create({
          data: {
            name: categoryName,
            venueId: tenantContext.venueId,
            position: 99,
          },
        });
      }

      // Update the item
      const updatedItem = await prisma.menuItem.update({
        where: {
          id: params.id,
        },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          price: parseFloat(price),
          taxRate: parseFloat(taxRate || '8.1'),
          allergens: allergens || [],
          imageUrl: imageUrl?.trim() || null,
          isActive: isAvailable !== undefined ? isAvailable : true,
          categoryId: category.id,
        },
        include: {
          category: true,
        },
      });

      return NextResponse.json(updatedItem);
    });
  } catch (error) {
    console.error('Error updating item:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
