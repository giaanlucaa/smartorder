import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@smartorder/db";
import { requireAuth } from "@smartorder/auth/session";
import { withTenantIsolation } from "@smartorder/auth/tenant";

export async function POST(req: NextRequest) {
  // Set DATABASE_URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://smartorder:smartorder@localhost:5432/smartorder";
  }

  try {
    const session = await requireAuth();
    const { name, price, categoryName, description, taxRate, allergens, imageUrl } = await req.json();

    return await withTenantIsolation(session, async (tenantContext) => {
      // Create or get category
      const cat = await prisma.menuCategory.upsert({
        where: { venueId_name: { venueId: tenantContext.venueId, name: categoryName } },
        update: {},
        create: { venueId: tenantContext.venueId, name: categoryName, position: 99 },
      });

      // Create menu item
      const item = await prisma.menuItem.create({ 
        data: { 
          categoryId: cat.id, 
          name, 
          description,
          price: Number(price), 
          taxRate: taxRate || 8.1, 
          allergens: allergens || [],
          imageUrl,
        } 
      });
      
      return NextResponse.json(item);
    });
  } catch (error) {
    console.error("Error creating menu item:", error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
