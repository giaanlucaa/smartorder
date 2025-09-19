import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../packages/db/src/index";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    // Build-Zeit/Fallback: kein DB-Zugriff
    return NextResponse.json({ 
      categories: [], 
      items: [] 
    }, { status: 200 });
  }

  const venueId = req.nextUrl.searchParams.get("venue");
  if (!venueId) return NextResponse.json({ error: "venue missing" }, { status: 400 });

  try {
    // Verify venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const categories = await prisma.menuCategory.findMany({
      where: { venueId },
      orderBy: { position: "asc" },
      include: { items: { where: { isActive: true } } },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
}
